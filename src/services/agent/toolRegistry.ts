/**
 * Centralized MAYRA Agent V1 Tool Registry & Dispatcher
 * 
 * Defines:
 * - Strongly typed tool definitions & schemas
 * - Permission levels (SAFE, CONFIRMATION_REQUIRED, BLOCKED)
 * - Validation & Timeout handling
 * - Android Bridge & Web API execution bindings
 */

import { AgentPermissionLevel, AgentPendingConfirmation } from '../../types';
import { MayraSystemBridge } from '../native/MayraSystemIntegrationBridge';
import { MemoryVaultService } from '../memory/memoryVaultService';
import { ContactFuzzyMatcher } from '../contacts/contactFuzzyMatcher';
import { TypingToolService, TypingSpeed } from '../tools/typingTool';

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  permissionLevel: AgentPermissionLevel;
  requiresConfirmation: boolean;
  timeoutMs: number;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required: string[];
  };
  generateConfirmationDetails?: (args: Record<string, any>) => {
    actionDescription: string;
    targetRecipient?: string;
    contentPreview?: string;
    impactLevel: 'low' | 'medium' | 'high';
  };
  execute: (args: Record<string, any>, context?: any) => Promise<any>;
}

export class AgentToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static {
    // 1. search_memory (SAFE)
    AgentToolRegistry.register({
      name: 'search_memory',
      description: "Search personal facts, contact details, notes, preferences, or saved memories in MAYRA's Memory Vault.",
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 4000,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query or keyword (e.g., "Zafer phone number", "favorite food", "birthday")'
          },
          category: {
            type: 'string',
            description: 'Optional category filter: personal, preferences, facts, routines, contacts',
            enum: ['personal', 'preferences', 'facts', 'routines', 'contacts']
          }
        },
        required: ['query']
      },
      execute: async (args) => {
        const query = (args.query || '').trim().toLowerCase();
        let allMemories: any[] = [];
        try {
          allMemories = MemoryVaultService.loadPersistedMemories([]);
        } catch (e) {
          allMemories = [];
        }
        const matches = allMemories.filter(m => {
          const inKey = (m.key || '').toLowerCase().includes(query);
          const inVal = (m.value || '').toLowerCase().includes(query);
          const inCategory = !args.category || m.category === args.category;
          return (inKey || inVal) && inCategory;
        });

        return {
          foundCount: matches.length,
          memories: matches.slice(0, 5).map(m => ({
            key: m.key,
            value: m.value,
            category: m.category
          }))
        };
      }
    });

    // 2. read_project_memory (SAFE)
    AgentToolRegistry.register({
      name: 'read_project_memory',
      description: 'Read system capabilities, architecture state, and developer notes.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 3000,
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to inspect: e.g., "capabilities", "system_bridge", "creator"'
          }
        },
        required: []
      },
      execute: async (args) => {
        const topic = (args.topic || '').toLowerCase();
        if (topic.includes('creator') || topic.includes('developer')) {
          return { info: 'MAYRA was created by Zafer as an advanced Android AI assistant.' };
        }
        return {
          system: 'MAYRA AI Agent V1',
          capabilities: ['Voice Synthesis (Aoede 24kHz)', 'Memory Vault', 'Multimodal Vision', 'Continuous Voice Loop', 'Android Bridge'],
          status: 'Operational'
        };
      }
    });

    // 3. get_device_status (SAFE)
    AgentToolRegistry.register({
      name: 'get_device_status',
      description: 'Query device battery, network connectivity, active Android permissions, and bridge health.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 3500,
      parameters: {
        type: 'object',
        properties: {
          includePermissions: {
            type: 'boolean',
            description: 'Whether to include detailed permission statuses'
          }
        },
        required: []
      },
      execute: async (args) => {
        const bridgeStatus = await MayraSystemBridge.checkStatus();
        return {
          isAndroidNative: bridgeStatus.isNativeAndroidEnvironment,
          accessibilityActive: bridgeStatus.isAccessibilityActive,
          notificationListenerActive: bridgeStatus.isNotificationListenerActive,
          batteryOptimizationExempt: bridgeStatus.isBatteryOptimizationExempt,
          canDrawOverlays: bridgeStatus.canDrawOverlays,
          networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
          timestamp: Date.now()
        };
      }
    });

    // 4. open_app (SAFE)
    AgentToolRegistry.register({
      name: 'open_app',
      description: 'Launch or switch to an installed application on the device (e.g. WhatsApp, Chrome, Camera, Settings, YouTube).',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 5000,
      parameters: {
        type: 'object',
        properties: {
          appName: {
            type: 'string',
            description: 'Name of the app to launch (e.g., "WhatsApp", "Chrome", "Camera", "Settings", "YouTube")'
          }
        },
        required: ['appName']
      },
      execute: async (args) => {
        const appName = args.appName.trim();
        const res = await MayraSystemBridge.launchApp(appName);
        return {
          success: res.success,
          message: res.message,
          launchedApp: appName
        };
      }
    });

    // 5. open_url (SAFE)
    AgentToolRegistry.register({
      name: 'open_url',
      description: 'Safely open a web URL in the browser or a new tab.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 4000,
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The complete HTTP/HTTPS URL to open'
          },
          title: {
            type: 'string',
            description: 'Optional label or title for the URL destination'
          }
        },
        required: ['url']
      },
      execute: async (args) => {
        const rawUrl = (args.url || '').trim();
        let targetUrl = rawUrl;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = 'https://' + targetUrl;
        }

        // Safe URL validation
        try {
          const parsed = new URL(targetUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('Unsupported protocol');
          }
          if (typeof window !== 'undefined') {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }
          return { success: true, openedUrl: targetUrl };
        } catch (e: any) {
          return { success: false, error: `Invalid URL: ${e.message}` };
        }
      }
    });

    // 6. read_notification (SAFE)
    AgentToolRegistry.register({
      name: 'read_notification',
      description: 'Read recent notifications captured by the Android Notification Listener Service (e.g. WhatsApp messages, SMS alerts).',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 4000,
      parameters: {
        type: 'object',
        properties: {
          packageName: {
            type: 'string',
            description: 'Filter by app package (e.g., "com.whatsapp", "com.google.android.apps.messaging")'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of recent notifications to retrieve (1-10)'
          }
        },
        required: []
      },
      execute: async (args) => {
        const notifications = await MayraSystemBridge.getRecentNotifications();
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(1, args.limit), 10) : 5;
        const filtered = args.packageName 
          ? notifications.filter(n => n.packageName?.toLowerCase().includes(args.packageName.toLowerCase()))
          : notifications;

        return {
          count: Math.min(filtered.length, limit),
          notifications: filtered.slice(0, limit).map(n => ({
            sender: n.sender || n.appName,
            text: n.text,
            time: n.timestamp,
            app: n.appName || n.packageName
          }))
        };
      }
    });

    // 7. request_permission (SAFE)
    AgentToolRegistry.register({
      name: 'request_permission',
      description: 'Prompt user or navigate to system settings for Android permissions (e.g. accessibility, sms, notifications).',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 4000,
      parameters: {
        type: 'object',
        properties: {
          permissionId: {
            type: 'string',
            description: 'Identifier of the permission (e.g. "accessibility", "notifications", "sms", "calls", "camera")'
          }
        },
        required: ['permissionId']
      },
      execute: async (args) => {
        const perm = (args.permissionId || '').toLowerCase();
        await MayraSystemBridge.requestPermission(perm);
        return {
          status: 'prompted',
          permissionId: perm,
          instruction: 'User redirected to permissions configuration'
        };
      }
    });

    // 8. send_sms (CONFIRMATION_REQUIRED)
    AgentToolRegistry.register({
      name: 'send_sms',
      description: 'Send an SMS text message to a specific recipient phone number.',
      permissionLevel: 'CONFIRMATION_REQUIRED',
      requiresConfirmation: true,
      timeoutMs: 6000,
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Name of the contact or recipient'
          },
          phoneNumber: {
            type: 'string',
            description: 'Phone number to send the SMS to'
          },
          message: {
            type: 'string',
            description: 'The exact text message content to send'
          }
        },
        required: ['recipient', 'message']
      },
      generateConfirmationDetails: (args) => ({
        actionDescription: `Send SMS to ${args.recipient}${args.phoneNumber ? ` (${args.phoneNumber})` : ''}`,
        targetRecipient: args.recipient,
        contentPreview: args.message,
        impactLevel: 'high'
      }),
      execute: async (args) => {
        const recipient = args.phoneNumber || args.recipient;
        const msg = args.message;
        const res = await MayraSystemBridge.sendSmsDirect(recipient, msg);
        return {
          success: res.success,
          recipient,
          message: msg,
          details: res.message || 'SMS sent via native SmsManager / Android Intent'
        };
      }
    });

    // 9. send_whatsapp_message (CONFIRMATION_REQUIRED)
    AgentToolRegistry.register({
      name: 'send_whatsapp_message',
      description: 'Send a message to a contact on WhatsApp via Accessibility Service or direct link intent.',
      permissionLevel: 'CONFIRMATION_REQUIRED',
      requiresConfirmation: true,
      timeoutMs: 6000,
      parameters: {
        type: 'object',
        properties: {
          contactName: {
            type: 'string',
            description: 'Name of the contact to message'
          },
          phoneNumber: {
            type: 'string',
            description: 'Optional phone number with country code'
          },
          message: {
            type: 'string',
            description: 'The exact message text to send'
          }
        },
        required: ['contactName', 'message']
      },
      generateConfirmationDetails: (args) => ({
        actionDescription: `Send WhatsApp message to ${args.contactName}${args.phoneNumber ? ` (${args.phoneNumber})` : ''}`,
        targetRecipient: args.contactName,
        contentPreview: args.message,
        impactLevel: 'high'
      }),
      execute: async (args) => {
        const matcher = ContactFuzzyMatcher.getInstance();
        const matchResult = matcher.matchContact(args.contactName);

        // If not exact match but a close match exists, ask for confirmation!
        if (!matchResult.exact && matchResult.matchedContact) {
          return {
            success: false,
            needsClarification: true,
            clarificationPrompt: matchResult.clarificationPrompt,
            closestMatch: matchResult.matchedContact.name,
            phoneNumber: matchResult.matchedContact.phoneNumber,
            details: matchResult.clarificationPrompt
          };
        }

        const target = args.phoneNumber || matchResult.matchedContact?.phoneNumber || args.contactName;
        const msg = args.message;
        const res = await MayraSystemBridge.sendWhatsAppMessage(target, msg, true);
        return {
          success: res.success,
          contactName: matchResult.matchedContact?.name || args.contactName,
          message: msg,
          details: res.message || 'WhatsApp message dispatched via Accessibility Service / Intent'
        };
      }
    });

    // 10. make_call (CONFIRMATION_REQUIRED)
    AgentToolRegistry.register({
      name: 'make_call',
      description: 'Initiate a phone call to a contact or phone number via Telecom InCallService / Dialer.',
      permissionLevel: 'CONFIRMATION_REQUIRED',
      requiresConfirmation: true,
      timeoutMs: 6000,
      parameters: {
        type: 'object',
        properties: {
          contactName: {
            type: 'string',
            description: 'Name of the contact to call'
          },
          phoneNumber: {
            type: 'string',
            description: 'Phone number to dial'
          }
        },
        required: ['contactName']
      },
      generateConfirmationDetails: (args) => ({
        actionDescription: `Place phone call to ${args.contactName}${args.phoneNumber ? ` (${args.phoneNumber})` : ''}`,
        targetRecipient: args.contactName,
        contentPreview: args.phoneNumber || 'Contact Phone',
        impactLevel: 'high'
      }),
      execute: async (args) => {
        const matcher = ContactFuzzyMatcher.getInstance();
        const matchResult = matcher.matchContact(args.contactName);

        if (!matchResult.exact && matchResult.matchedContact) {
          return {
            success: false,
            needsClarification: true,
            clarificationPrompt: matchResult.clarificationPrompt,
            closestMatch: matchResult.matchedContact.name,
            phoneNumber: matchResult.matchedContact.phoneNumber,
            details: matchResult.clarificationPrompt
          };
        }

        const target = args.phoneNumber || matchResult.matchedContact?.phoneNumber || args.contactName;
        const res = await MayraSystemBridge.placePhoneCall(target);
        return {
          success: res.success,
          contact: matchResult.matchedContact?.name || args.contactName,
          details: res.message || 'Call initiated via Telecom / Dialer'
        };
      }
    });

    // 10b. typing_tool (SAFE)
    AgentToolRegistry.register({
      name: 'typing_tool',
      description: 'Autonomously type text into search boxes, forms, or chat inputs with adjustable speed (fast/normal/slow) and natural human cadence.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 12000,
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text string for MAYRA to type'
          },
          speed: {
            type: 'string',
            description: 'Speed: "fast", "normal", or "slow"'
          },
          target: {
            type: 'string',
            description: 'Target input name or element selector'
          }
        },
        required: ['text']
      },
      execute: async (args) => {
        const typingService = TypingToolService.getInstance();
        const speed = (args.speed as TypingSpeed) || 'normal';
        const res = await typingService.typeText(args.text, {
          speed,
          target: args.target || 'chat_input',
          addHumanJitter: true
        });
        return {
          success: res.success,
          text: res.typedText,
          durationMs: res.durationMs,
          speed
        };
      }
    });
    // 11. delegate_to_stonicx (SAFE)
    AgentToolRegistry.register({
      name: 'delegate_to_stonicx',
      description: 'Delegate technical tasks, code generation, debugging, refactoring, or algorithmic work to the STONICX Silicon Brain while Mayra remains in charge of the conversation.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 15000,
      parameters: {
        type: 'object',
        properties: {
          taskDescription: {
            type: 'string',
            description: 'The exact technical problem, code to write/debug, or question for STONICX'
          },
          language: {
            type: 'string',
            description: 'Programming language or target stack (e.g., Kotlin, TypeScript, Python, C++, SQL)'
          }
        },
        required: ['taskDescription']
      },
      execute: async (args) => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `[DELEGATED TASK FOR STONICX]: ${args.taskDescription} ${args.language ? `(Target stack: ${args.language})` : ''}`,
              assistant: 'stonicx',
              persona: 'technical'
            })
          });
          const data = await res.json();
          return {
            success: true,
            agent: 'STONICX Silicon Core',
            response: data.response || 'Task executed by STONICX.'
          };
        } catch (e: any) {
          return {
            success: false,
            error: e.message || 'Failed to communicate with STONICX Core'
          };
        }
      }
    });

    // 12. web_search (SAFE - Deep Research Sub-Agent)
    AgentToolRegistry.register({
      name: 'web_search',
      description: 'Perform real-time multi-query web search for documentation, current events, live news, or factual answers via Deep Research Sub-Agent.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 8000,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on the web'
          }
        },
        required: ['query']
      },
      execute: async (args) => {
        try {
          const res = await fetch('/api/tools/web-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: args.query })
          });
          const data = await res.json();
          return {
            success: true,
            agent: 'Deep Research Agent',
            results: data.results || []
          };
        } catch (e: any) {
          return {
            success: false,
            error: e.message || 'Web search query failed'
          };
        }
      }
    });

    // 13. scan_codebase (SAFE - Coding & Architecture Sub-Agent)
    AgentToolRegistry.register({
      name: 'scan_codebase',
      description: 'Scan repository files, components, architecture, and module structure via Coding & Architecture Sub-Agent.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 6000,
      parameters: {
        type: 'object',
        properties: {
          module: {
            type: 'string',
            description: 'The module name or "all" to scan'
          }
        },
        required: []
      },
      execute: async (args) => {
        try {
          const res = await fetch('/api/tools/codebase-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: args.module || 'all' })
          });
          const data = await res.json();
          return {
            success: true,
            agent: 'Coding & Architecture Agent',
            totalFiles: data.totalFiles,
            modules: data.modules
          };
        } catch (e: any) {
          return {
            success: false,
            error: e.message || 'Codebase scan failed'
          };
        }
      }
    });

    // 14. eval_sandbox_code (SAFE - Sandbox Runner)
    AgentToolRegistry.register({
      name: 'eval_sandbox_code',
      description: 'Safely evaluate mathematical computations, data transformations, or logic snippets in the isolated Sandbox Code Runner.',
      permissionLevel: 'SAFE',
      requiresConfirmation: false,
      timeoutMs: 4000,
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The JavaScript / Math expression to evaluate safely'
          }
        },
        required: ['code']
      },
      execute: async (args) => {
        try {
          const res = await fetch('/api/tools/terminal-eval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: args.code })
          });
          const data = await res.json();
          return {
            success: true,
            agent: 'Sandbox Code Runner',
            output: data.output
          };
        } catch (e: any) {
          return {
            success: false,
            error: e.message || 'Sandbox evaluation failed'
          };
        }
      }
    });
  }

  public static register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): ToolDefinition | undefined {
    if (name === 'read_recent_notifications' || name === 'read_notifications') {
      return this.tools.get('read_recent_notifications') || this.tools.get('read_notification');
    }
    return this.tools.get(name);
  }

  public static getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public static getDeclarationsForGemini(): any[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));
  }

  /**
   * Dispatches a tool execution with permission checks, timeout guards, and error protection
   */
  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    userConfirmed: boolean = false
  ): Promise<{ success: boolean; result?: any; error?: string; requiresConfirmation?: boolean; confirmationDetails?: AgentPendingConfirmation }> {
    const tool = this.getTool(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" is not registered in MAYRA Tool Registry.`
      };
    }

    if (tool.permissionLevel === 'BLOCKED') {
      return {
        success: false,
        error: `Tool "${toolName}" is blocked by system security policy.`
      };
    }

    // Schema Validation: Check required parameters
    if (tool.parameters?.required && Array.isArray(tool.parameters.required)) {
      for (const reqParam of tool.parameters.required) {
        const val = args?.[reqParam];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          return {
            success: false,
            error: `Validation error: Missing required argument "${reqParam}" for tool "${toolName}".`
          };
        }
      }
    }

    // Permission gate check
    if (tool.requiresConfirmation && !userConfirmed) {
      const details = tool.generateConfirmationDetails 
        ? tool.generateConfirmationDetails(args)
        : {
            actionDescription: `Execute action ${toolName}`,
            impactLevel: 'medium' as const
          };

      return {
        success: false,
        requiresConfirmation: true,
        confirmationDetails: {
          toolName,
          args,
          actionDescription: details.actionDescription,
          targetRecipient: details.targetRecipient,
          contentPreview: details.contentPreview,
          impactLevel: details.impactLevel
        }
      };
    }

    // Execute with timeout protection
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Tool ${toolName} timed out after ${tool.timeoutMs}ms`)), tool.timeoutMs);
      });

      const result = await Promise.race([
        tool.execute(args),
        timeoutPromise
      ]);

      return {
        success: true,
        result
      };
    } catch (err: any) {
      console.warn(`[AgentToolRegistry] Error executing tool ${toolName}:`, err);
      return {
        success: false,
        error: err.message || `Execution error in ${toolName}`
      };
    }
  }
}

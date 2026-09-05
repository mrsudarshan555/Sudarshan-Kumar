/**
 * Contact Fuzzy Matcher Engine
 * 
 * When a user speaks or types a contact name (e.g. "Ramesh ko message bhejo")
 * and an exact match is not found, this engine identifies the closest matching contact
 * and generates a polite clarification prompt:
 * "Kya aapka matlab [closestName] hai?"
 */

export interface ContactRecord {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  source: 'family' | 'emergency' | 'memory' | 'address_book';
}

export interface FuzzyMatchResult {
  exact: boolean;
  matchFound: boolean;
  searchedName: string;
  matchedContact?: ContactRecord;
  similarity: number;
  clarificationPrompt?: string;
  alternatives?: ContactRecord[];
}

export class ContactFuzzyMatcher {
  private static instance: ContactFuzzyMatcher | null = null;

  // Default address book with common Indian and international contacts for seamless voice assistant interaction
  private defaultContacts: ContactRecord[] = [
    { id: 'def-1', name: 'Ramesh Kumar', phoneNumber: '+91 98765 12345', relationship: 'Colleague', source: 'address_book' },
    { id: 'def-2', name: 'Ramesh Verma', phoneNumber: '+91 98111 22334', relationship: 'Client', source: 'address_book' },
    { id: 'def-3', name: 'Rajesh Sharma', phoneNumber: '+91 98222 33445', relationship: 'Friend', source: 'address_book' },
    { id: 'def-4', name: 'Suresh Patel', phoneNumber: '+91 98333 44556', relationship: 'Manager', source: 'address_book' },
    { id: 'def-5', name: 'Priya Singh', phoneNumber: '+91 98444 55667', relationship: 'Sister', source: 'address_book' },
    { id: 'def-6', name: 'Mom', phoneNumber: '+91 98765 43210', relationship: 'Mother', source: 'family' },
    { id: 'def-7', name: 'Dad', phoneNumber: '+91 98765 43211', relationship: 'Father', source: 'family' },
    { id: 'def-8', name: 'Dr. Sharma', phoneNumber: '+91 98112 23344', relationship: 'Doctor', source: 'address_book' },
    { id: 'def-9', name: 'Zafer', phoneNumber: '+91 98765 00000', relationship: 'Architect / Creator', source: 'address_book' },
    { id: 'def-10', name: 'Amit Verma', phoneNumber: '+91 98555 66778', relationship: 'Teammate', source: 'address_book' },
    { id: 'def-11', name: 'Rohit Sharma', phoneNumber: '+91 98666 77889', relationship: 'Friend', source: 'address_book' }
  ];

  public static getInstance(): ContactFuzzyMatcher {
    if (!this.instance) {
      this.instance = new ContactFuzzyMatcher();
    }
    return this.instance;
  }

  /**
   * Retrieves all contacts from localStorage, emergency contacts, and default address book
   */
  public getAllContacts(): ContactRecord[] {
    const list: ContactRecord[] = [...this.defaultContacts];

    // 1. Family contacts from localStorage
    try {
      const familyRaw = localStorage.getItem('mayra_family_contacts');
      if (familyRaw) {
        const familyList = JSON.parse(familyRaw);
        if (Array.isArray(familyList)) {
          familyList.forEach((c: any) => {
            if (c.name) {
              list.push({
                id: c.id || `fam-${Date.now()}-${Math.random()}`,
                name: c.name,
                phoneNumber: c.whatsappNumber || c.phoneNumber || '',
                relationship: c.relationship || 'Family',
                source: 'family'
              });
            }
          });
        }
      }
    } catch {}

    // 2. Emergency contacts from localStorage
    try {
      const emRaw = localStorage.getItem('stonicx_emergency_contacts');
      if (emRaw) {
        const emList = JSON.parse(emRaw);
        if (Array.isArray(emList)) {
          emList.forEach((c: any) => {
            if (c.name) {
              list.push({
                id: c.id || `em-${Date.now()}`,
                name: c.name,
                phoneNumber: c.phoneNumber || '',
                relationship: c.relation || 'Emergency',
                source: 'emergency'
              });
            }
          });
        }
      }
    } catch {}

    // Deduplicate by name & phone
    const seen = new Set<string>();
    return list.filter(c => {
      const key = `${c.name.toLowerCase()}_${c.phoneNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Match user spoken name against contacts with fuzzy logic
   */
  public matchContact(inputName: string): FuzzyMatchResult {
    const cleanInput = inputName.trim().toLowerCase();
    if (!cleanInput) {
      return { exact: false, matchFound: false, searchedName: inputName, similarity: 0 };
    }

    const contacts = this.getAllContacts();

    // 1. Check exact match (case-insensitive)
    const exactMatch = contacts.find(c => c.name.toLowerCase() === cleanInput);
    if (exactMatch) {
      return {
        exact: true,
        matchFound: true,
        searchedName: inputName,
        matchedContact: exactMatch,
        similarity: 1.0
      };
    }

    // 2. Check prefix / contains match
    const prefixMatch = contacts.find(c => {
      const n = c.name.toLowerCase();
      return n.startsWith(cleanInput) || cleanInput.startsWith(n);
    });

    if (prefixMatch) {
      const isSub = prefixMatch.name.toLowerCase().includes(cleanInput) || cleanInput.includes(prefixMatch.name.toLowerCase());
      return {
        exact: false,
        matchFound: true,
        searchedName: inputName,
        matchedContact: prefixMatch,
        similarity: 0.88,
        clarificationPrompt: `Kya aapka matlab ${prefixMatch.name} (${prefixMatch.phoneNumber || prefixMatch.relationship || 'Contact'}) hai?`
      };
    }

    // 3. Levenshtein distance calculation
    let bestMatch: ContactRecord | null = null;
    let highestSim = 0;
    const candidates: Array<{ contact: ContactRecord; sim: number }> = [];

    for (const contact of contacts) {
      const sim = this.calculateSimilarity(cleanInput, contact.name.toLowerCase());
      if (sim > 0.45) {
        candidates.push({ contact, sim });
        if (sim > highestSim) {
          highestSim = sim;
          bestMatch = contact;
        }
      }
    }

    candidates.sort((a, b) => b.sim - a.sim);

    if (bestMatch && highestSim >= 0.45) {
      return {
        exact: false,
        matchFound: true,
        searchedName: inputName,
        matchedContact: bestMatch,
        similarity: highestSim,
        clarificationPrompt: `Kya aapka matlab "${bestMatch.name}" (${bestMatch.phoneNumber || bestMatch.relationship || 'Contact'}) hai?`,
        alternatives: candidates.slice(1, 4).map(c => c.contact)
      };
    }

    // No close match found
    return {
      exact: false,
      matchFound: false,
      searchedName: inputName,
      similarity: highestSim,
      clarificationPrompt: `Mujhe "${inputName}" naam ka koi contact nahi mila. Kya aapka matlab inme se koi hai: ${contacts.slice(0, 3).map(c => c.name).join(', ')}?`
    };
  }

  /**
   * Helper: Calculate string similarity (0 to 1) based on Levenshtein and token overlap
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.trim().toLowerCase();
    const s2 = str2.trim().toLowerCase();

    if (s1 === s2) return 1.0;
    if (s2.includes(s1) || s1.includes(s2)) {
      const minLen = Math.min(s1.length, s2.length);
      const maxLen = Math.max(s1.length, s2.length);
      return Math.max(0.75, minLen / maxLen);
    }

    // Check token overlap (e.g. "Ramesh" in "Ramesh Kumar")
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (w1 === w2 && w1.length > 2) return 0.85;
      }
    }

    // Levenshtein edit distance
    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null)
    );

    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const dist = track[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0, 1 - dist / maxLen);
  }
}

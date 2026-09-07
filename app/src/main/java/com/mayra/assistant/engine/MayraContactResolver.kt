package com.mayra.assistant.engine

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.util.Log

/**
 * MAYRA Verified Contact Resolver
 * 
 * Performs high-precision, search-first contact lookups using ContactsContract.
 * Enforces strict verification and returns structured disambiguation results
 * whenever multiple candidates match a spoken name.
 */
class MayraContactResolver(private val context: Context) {

    companion object {
        private const val TAG = "MayraContactResolver"
    }

    data class ContactRecord(
        val contactId: String,
        val displayName: String,
        val phoneNumber: String = "",
        val phoneTypeLabel: String = "Mobile",
        val emailAddress: String = "",
        val matchScore: Float = 1.0f
    )

    sealed class ResolutionResult {
        data class ExactMatch(val contact: ContactRecord) : ResolutionResult()
        data class Ambiguous(val candidates: List<ContactRecord>, val promptMessage: String) : ResolutionResult()
        data class NotFound(val query: String, val message: String) : ResolutionResult()
    }

    /**
     * Resolves a spoken contact name against local verified contacts.
     * If multiple contacts match (e.g. "Rahul Sharma" and "Rahul Work"),
     * it produces an Ambiguous result to prompt the user vocally.
     */
    fun resolveContact(query: String, forEmail: Boolean = false): ResolutionResult {
        val cleanQuery = query.trim().lowercase()
        if (cleanQuery.isBlank()) {
            return ResolutionResult.NotFound(query, "Contact name is empty.")
        }

        val matches = if (forEmail) {
            queryEmailContacts(cleanQuery)
        } else {
            queryPhoneContacts(cleanQuery)
        }

        return when {
            matches.isEmpty() -> {
                Log.w(TAG, "No contact matched query: '$cleanQuery'")
                ResolutionResult.NotFound(query, "Mujhe '$query' naam ka koi contact nahi mila.")
            }
            matches.size == 1 -> {
                Log.i(TAG, "Exact contact match found: ${matches.first().displayName} (${matches.first().phoneNumber})")
                ResolutionResult.ExactMatch(matches.first())
            }
            else -> {
                // Ambiguity detected: format voice prompt
                val namesList = matches.take(3).joinToString(", ") { contact ->
                    if (contact.phoneTypeLabel.isNotBlank() && contact.phoneTypeLabel != "Mobile") {
                        "${contact.displayName} (${contact.phoneTypeLabel})"
                    } else {
                        contact.displayName
                    }
                }
                val prompt = "Mujhe '$query' naam se ${matches.size} contacts mile: $namesList. Aap kise message bhejna chahte hain?"
                Log.i(TAG, "Ambiguous contacts detected: $prompt")
                ResolutionResult.Ambiguous(matches, prompt)
            }
        }
    }

    private fun queryPhoneContacts(query: String): List<ContactRecord> {
        val results = mutableListOf<ContactRecord>()
        val resolver: ContentResolver = context.contentResolver

        val uri: Uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE,
            ContactsContract.CommonDataKinds.Phone.LABEL
        )

        // Search with broad LIKE condition
        val selection = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ?"
        val selectionArgs = arrayOf("%$query%")
        val sortOrder = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC"

        var cursor: Cursor? = null
        try {
            cursor = resolver.query(uri, projection, selection, selectionArgs, sortOrder)
            cursor?.let {
                val idIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val nameIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                val numIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                val typeIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE)
                val labelIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.LABEL)

                val seenNumbers = mutableSetOf<String>()

                while (it.moveToNext()) {
                    val id = if (idIdx != -1) it.getString(idIdx) ?: "" else ""
                    val name = if (nameIdx != -1) it.getString(nameIdx) ?: "" else ""
                    val rawNumber = if (numIdx != -1) it.getString(numIdx) ?: "" else ""
                    val type = if (typeIdx != -1) it.getInt(typeIdx) else ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE
                    val customLabel = if (labelIdx != -1) it.getString(labelIdx) ?: "" else ""

                    val cleanNum = rawNumber.replace("[^0-9+]".toRegex(), "")
                    if (cleanNum.length < 5 || seenNumbers.contains(cleanNum)) continue
                    seenNumbers.add(cleanNum)

                    val typeLabel = if (type == ContactsContract.CommonDataKinds.Phone.TYPE_CUSTOM && customLabel.isNotBlank()) {
                        customLabel
                    } else {
                        ContactsContract.CommonDataKinds.Phone.getTypeLabel(context.resources, type, "").toString()
                    }

                    val score = calculateNameScore(query, name.lowercase())
                    results.add(ContactRecord(
                        contactId = id,
                        displayName = name,
                        phoneNumber = cleanNum,
                        phoneTypeLabel = typeLabel,
                        matchScore = score
                    ))
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission READ_CONTACTS not granted", e)
        } catch (e: Exception) {
            Log.e(TAG, "Error querying phone contacts", e)
        } finally {
            cursor?.close()
        }

        // Sort by match score descending (exact name match first)
        results.sortByDescending { it.matchScore }

        // If top result is an exact full match, prioritize it
        val exactMatches = results.filter { it.displayName.equals(query, ignoreCase = true) }
        return if (exactMatches.size == 1) exactMatches else results
    }

    private fun queryEmailContacts(query: String): List<ContactRecord> {
        val results = mutableListOf<ContactRecord>()
        val resolver: ContentResolver = context.contentResolver

        val uri: Uri = ContactsContract.CommonDataKinds.Email.CONTENT_URI
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Email.CONTACT_ID,
            ContactsContract.CommonDataKinds.Email.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Email.ADDRESS
        )

        val selection = "${ContactsContract.CommonDataKinds.Email.DISPLAY_NAME} LIKE ? OR ${ContactsContract.CommonDataKinds.Email.ADDRESS} LIKE ?"
        val selectionArgs = arrayOf("%$query%", "%$query%")

        var cursor: Cursor? = null
        try {
            cursor = resolver.query(uri, projection, selection, selectionArgs, null)
            cursor?.let {
                val idIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Email.CONTACT_ID)
                val nameIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Email.DISPLAY_NAME)
                val emailIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Email.ADDRESS)

                while (it.moveToNext()) {
                    val id = if (idIdx != -1) it.getString(idIdx) ?: "" else ""
                    val name = if (nameIdx != -1) it.getString(nameIdx) ?: "" else ""
                    val email = if (emailIdx != -1) it.getString(emailIdx) ?: "" else ""

                    if (email.contains("@")) {
                        results.add(ContactRecord(
                            contactId = id,
                            displayName = name.ifBlank { email },
                            emailAddress = email,
                            matchScore = calculateNameScore(query, name.lowercase())
                        ))
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error querying email contacts", e)
        } finally {
            cursor?.close()
        }

        results.sortByDescending { it.matchScore }
        return results
    }

    private fun calculateNameScore(query: String, target: String): Float {
        if (query == target) return 1.0f
        if (target.startsWith(query)) return 0.9f
        if (target.split(" ").any { it == query }) return 0.85f
        if (target.contains(query)) return 0.7f
        return 0.5f
    }
}

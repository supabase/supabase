<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

Το [Supabase](https://supabase.com) είναι μια εναλλακτική λύση ανοιχτού κώδικα στο Firebase. Δημιουργούμε τις λειτουργίες του Firebase χρησιμοποιώντας εργαλεία ανοιχτού κώδικα επιχειρηματικού επιπέδου.

**Βασικά χαρακτηριστικά:**

- [x] **Διαχειριζόμενη βάση δεδομένων Postgres:** [Τεκμηρίωση](https://supabase.com/docs/guides/database)
- [x] **Έλεγχος ταυτότητας και εξουσιοδότηση:** [Τεκμηρίωση](https://supabase.com/docs/guides/auth)
- [x] **Αυτόματα δημιουργούμενα API:**
    - [x] REST: [Τεκμηρίωση](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Τεκμηρίωση](https://supabase.com/docs/guides/graphql)
    - [x] Συνδρομές σε πραγματικό χρόνο: [Τεκμηρίωση](https://supabase.com/docs/guides/realtime)
- [x] **Λειτουργίες:**
    - [x] Λειτουργίες βάσης δεδομένων: [Τεκμηρίωση](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (Λειτουργίες στην άκρη του δικτύου): [Τεκμηρίωση](https://supabase.com/docs/guides/functions)
- [x] **Αποθήκευση αρχείων:** [Τεκμηρίωση](https://supabase.com/docs/guides/storage)
- [x] **Εργαλεία AI, διανυσμάτων και ενσωματώσεων (embeddings):** [Τεκμηρίωση](https://supabase.com/docs/guides/ai)
- [x] **Πίνακας ελέγχου**

![Πίνακας ελέγχου Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Εγγραφείτε στις "εκδόσεις" (releases) αυτού του αποθετηρίου για να λαμβάνετε ειδοποιήσεις σχετικά με σημαντικές ενημερώσεις. Αυτό θα σας επιτρέψει να είστε ενήμεροι για τις τελευταίες αλλαγές και βελτιώσεις.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Παρακολούθηση αποθετηρίου"/></kbd>

## Τεκμηρίωση

Η πλήρης τεκμηρίωση είναι διαθέσιμη στη διεύθυνση [supabase.com/docs](https://supabase.com/docs). Εκεί θα βρείτε όλους τους απαραίτητους οδηγούς και υλικό αναφοράς.

Εάν θέλετε να συνεισφέρετε στην ανάπτυξη του έργου, ανατρέξτε στην ενότητα [Ξεκινώντας](./../DEVELOPERS.md).

## Κοινότητα και υποστήριξη

*   **Φόρουμ κοινότητας:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ιδανικό για να λάβετε βοήθεια για την ανάπτυξη και να συζητήσετε τις βέλτιστες πρακτικές για την εργασία με βάσεις δεδομένων.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Χρησιμοποιήστε το για να αναφέρετε σφάλματα και προβλήματα που αντιμετωπίζετε κατά τη χρήση του Supabase.
*   **Υποστήριξη μέσω email:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Η καλύτερη επιλογή για την επίλυση προβλημάτων με τη βάση δεδομένων ή την υποδομή σας.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Ένα εξαιρετικό μέρος για να μοιραστείτε τις εφαρμογές σας και να επικοινωνήσετε με την κοινότητα.

## Τρόπος λειτουργίας

Το Supabase συνδυάζει πολλά εργαλεία ανοιχτού κώδικα. Δημιουργούμε λειτουργίες παρόμοιες με το Firebase χρησιμοποιώντας δοκιμασμένα προϊόντα επιχειρηματικού επιπέδου. Εάν ένα εργαλείο ή μια κοινότητα υπάρχει και έχει άδεια MIT, Apache 2 ή παρόμοια ανοιχτή άδεια, θα χρησιμοποιήσουμε και θα υποστηρίξουμε αυτό το εργαλείο. Εάν ένα τέτοιο εργαλείο δεν υπάρχει, θα το δημιουργήσουμε μόνοι μας και θα ανοίξουμε τον πηγαίο κώδικά του. Το Supabase δεν είναι ακριβές αντίγραφο του Firebase. Στόχος μας είναι να παρέχουμε στους προγραμματιστές μια ευκολία χρήσης συγκρίσιμη με το Firebase, αλλά χρησιμοποιώντας εργαλεία ανοιχτού κώδικα.

**Αρχιτεκτονική**

Το Supabase είναι μια [διαχειριζόμενη πλατφόρμα](https://supabase.com/dashboard). Μπορείτε να εγγραφείτε και να αρχίσετε αμέσως να χρησιμοποιείτε το Supabase, χωρίς να χρειάζεται να εγκαταστήσετε τίποτα. Μπορείτε επίσης να [αναπτύξετε τη δική σας υποδομή](https://supabase.com/docs/guides/hosting/overview) και να [αναπτύξετε τοπικά](https://supabase.com/docs/guides/local-development).

![Αρχιτεκτονική](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Ένα αντικειμενοστρεφές σχεσιακό σύστημα διαχείρισης βάσεων δεδομένων με περισσότερα από 30 χρόνια ιστορίας ενεργούς ανάπτυξης. Είναι γνωστό για την αξιοπιστία, τη λειτουργικότητα και την απόδοσή του.
*   **Realtime:** Ένας διακομιστής Elixir που σας επιτρέπει να ακούτε για αλλαγές στο PostgreSQL (εισαγωγές, ενημερώσεις και διαγραφές) μέσω websockets. Το Realtime χρησιμοποιεί την ενσωματωμένη λειτουργικότητα αναπαραγωγής του Postgres, μετατρέπει τις αλλαγές σε JSON και τις μεταδίδει σε εξουσιοδοτημένους πελάτες.
*   **PostgREST:** Ένας διακομιστής web που μετατρέπει τη βάση δεδομένων PostgreSQL σε ένα RESTful API.
*   **GoTrue:** Ένα API βασισμένο σε JWT για τη διαχείριση χρηστών και την έκδοση διακριτικών JWT.
*   **Storage:** Παρέχει μια διεπαφή RESTful για τη διαχείριση αρχείων που είναι αποθηκευμένα στο S3, χρησιμοποιώντας το Postgres για τη διαχείριση αδειών.
*   **pg_graphql:** Μια επέκταση PostgreSQL που παρέχει ένα API GraphQL.
*   **postgres-meta:** Ένα RESTful API για τη διαχείριση του Postgres, επιτρέποντάς σας να λαμβάνετε πίνακες, να προσθέτετε ρόλους, να εκτελείτε ερωτήματα κ.λπ.
*   **Kong:** Μια πύλη API εγγενής στο cloud.

#### Βιβλιοθήκες πελάτη

Χρησιμοποιούμε μια αρθρωτή προσέγγιση για τις βιβλιοθήκες πελάτη. Κάθε υπο-βιβλιοθήκη έχει σχεδιαστεί για να λειτουργεί με ένα μόνο εξωτερικό σύστημα. Αυτός είναι ένας από τους τρόπους υποστήριξης των υπαρχόντων εργαλείων.

(Πίνακας με βιβλιοθήκες πελάτη, όπως στο πρωτότυπο, αλλά με ελληνικά ονόματα και επεξηγήσεις, όπου χρειάζεται).

| Γλώσσα                       | Πελάτης Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Επίσημες⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Υποστηριζόμενες από την κοινότητα💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Σήματα (Badges)

Μπορείτε να χρησιμοποιήσετε αυτά τα σήματα για να δείξετε ότι η εφαρμογή σας έχει δημιουργηθεί με το Supabase:

**Ανοιχτόχρωμο:**

![Δημιουργήθηκε με Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Δημιουργήθηκε με Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Δημιουργήθηκε με Supabase" />
</a>
```

**Σκούρο:**

![Δημιουργήθηκε με Supabase (σκούρα έκδοση)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Δημιουργήθηκε με Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Δημιουργήθηκε με Supabase" />
</a>
```

## Μεταφράσεις

[Λίστα μεταφράσεων](./languages.md)

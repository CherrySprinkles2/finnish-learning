// Static grammar content for the Grammar reference page.
// Aligned with Suomen mestari 1, Kappale 1–5 (Kappale 6–9 added later).
// 100% client-side: no API, no database. Exercises are checked locally.

export type BlockType =
  | 'prose'
  | 'table'
  | 'example'
  | 'rule'
  | 'gradation'
  | 'exercise'

export type ExerciseType =
  | 'fill-blank'
  | 'conjugation'
  | 'multiple-choice'
  | 'translate'
  | 'identify'

/** A paradigm / case-ending table. First column is rendered bold (the Finnish form). */
export interface TableContent {
  headers: string[]
  rows: string[][]
}

/** A Finnish sentence with word-by-word gloss and a free translation. */
export interface ExampleContent {
  words: { fi: string; en: string }[]
  translation: string
}

/** K-P-T consonant gradation: strong grade → weak grade → example word. */
export interface GradationContent {
  rows: { strong: string; weak: string; example: string }[]
}

/** One drill within an exercise block. */
export interface ExerciseItem {
  type: ExerciseType
  prompt: string
  /** Expected answer. Supports `/`-separated alternatives. May contain newlines for conjugation paradigms. */
  answer?: string
  /** For multiple-choice / identify. */
  options?: string[]
  /** Index into `options` of the correct choice. */
  correctOption?: number
  /** Skip auto-marking and just reveal the answer (default behaviour for translate / conjugation). */
  revealOnly?: boolean
  /** Optional explanation shown after the answer is revealed. */
  note?: string
}

export interface ExerciseContent {
  items: ExerciseItem[]
}

export interface GrammarBlock {
  type: BlockType
  title?: string
  // prose / rule  -> markdown string
  // table         -> TableContent
  // example       -> ExampleContent
  // gradation     -> GradationContent
  // exercise      -> ExerciseContent
  content: string | TableContent | ExampleContent | GradationContent | ExerciseContent
}

export interface GrammarSection {
  topic: string
  blocks: GrammarBlock[]
}

export interface GrammarChapter {
  number: number
  title: string
  subtitle: string
  sections: GrammarSection[]
}

export const grammarChapters: GrammarChapter[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // KAPPALE 1
  // ─────────────────────────────────────────────────────────────────────────
  {
    number: 1,
    title: 'Pronouns & olla',
    subtitle: 'Minkämaalainen sinä olet?',
    sections: [
      {
        topic: 'Personal pronouns',
        blocks: [
          {
            type: 'prose',
            content:
              'Finnish has six personal pronouns. There is **no gender** — `hän` means both "he" and "she". `te` is both plural "you" and the polite/formal singular "you".\n\nFinnish almost always drops the pronoun for *I* and *you* when the verb ending already shows who is meant (`puhun` = "I speak"). The pronoun is kept for emphasis and for `hän/he`.',
          },
          {
            type: 'table',
            title: 'Personal pronouns',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minä', 'I'],
                ['sinä', 'you (singular)'],
                ['hän', 'he / she'],
                ['me', 'we'],
                ['te', 'you (plural / polite)'],
                ['he', 'they'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'multiple-choice',
                  prompt: 'Which pronoun means "he / she"?',
                  options: ['he', 'hän', 'sinä'],
                  correctOption: 1,
                  note: '`he` (no accent) means "they"; `hän` means "he/she".',
                },
                {
                  type: 'fill-blank',
                  prompt: 'Translate "we" into Finnish:',
                  answer: 'me',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'The verb olla (to be)',
        blocks: [
          {
            type: 'prose',
            content:
              '`olla` ("to be") is irregular and the first verb you learn. Note that `hän` and `he` do **not** use the same form: `hän on`, but `he ovat`.',
          },
          {
            type: 'table',
            title: 'olla — present tense',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minä olen', 'I am'],
                ['sinä olet', 'you are'],
                ['hän on', 'he / she is'],
                ['me olemme', 'we are'],
                ['te olette', 'you are'],
                ['he ovat', 'they are'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Minä', en: 'I' },
                { fi: 'olen', en: 'am' },
                { fi: 'suomalainen.', en: 'Finnish.' },
              ],
              translation: 'I am Finnish.',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'conjugation',
                  prompt: 'Conjugate olla ("to be") for all six persons.',
                  answer:
                    'minä olen\nsinä olet\nhän on\nme olemme\nte olette\nhe ovat',
                  revealOnly: true,
                },
                {
                  type: 'multiple-choice',
                  prompt: 'Choose the correct form: "we are"',
                  options: ['me olette', 'me olemme', 'me ovat'],
                  correctOption: 1,
                },
                {
                  type: 'fill-blank',
                  prompt: 'Fill the blank: "hän ___" (he/she is)',
                  answer: 'on',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Vowel harmony (a / ä)',
        blocks: [
          {
            type: 'prose',
            content:
              'Finnish vowels split into two groups that **cannot mix** inside a single word. The endings you add (cases, `-ko/-kö`, etc.) must match the group of the word.\n\n- **Back vowels:** a, o, u → take **back** endings (`-ssa`, `-ko`, `-lla`)\n- **Front vowels:** ä, ö, y → take **front** endings (`-ssä`, `-kö`, `-llä`)\n- **Neutral:** e, i → can appear with either group',
          },
          {
            type: 'rule',
            content:
              'Look at the vowels in the word. If it contains **a, o, or u**, use the back ending (`-ssa`). If it only has **ä, ö, y** (plus maybe e/i), use the front ending (`-ssä`). A word with only e/i defaults to **front** endings (e.g. `meri` → `meressä`).',
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Add the inessive "-ssa / -ssä" to talo (house): talo___',
                  answer: 'talossa',
                  note: '`talo` has back vowels (a, o) → `-ssa`.',
                },
                {
                  type: 'fill-blank',
                  prompt: 'Add the inessive "-ssa / -ssä" to kylä (village): kylä___',
                  answer: 'kylässä',
                  note: '`kylä` has the front vowel ä → `-ssä`.',
                },
                {
                  type: 'identify',
                  prompt: 'Which ending suits "Helsinki" (only e/i vowels)?',
                  options: ['-ssa', '-ssä'],
                  correctOption: 1,
                  note: 'Words with only e/i take front endings → Helsingissä.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KAPPALE 2
  // ─────────────────────────────────────────────────────────────────────────
  {
    number: 2,
    title: 'Verb type 1, negation & questions',
    subtitle: 'Mitä kuuluu?',
    sections: [
      {
        topic: 'Verb type 1 conjugation',
        blocks: [
          {
            type: 'prose',
            content:
              'Verb type 1 covers verbs whose infinitive ends in **two vowels** (`puhua`, `asua`, `sanoa`). To conjugate:\n\n1. Drop the final `-a / -ä` to get the stem (`puhu-`).\n2. Add the personal ending.\n\nThe `hän` form **doubles the final vowel** (`puhu` → `puhuu`).',
          },
          {
            type: 'table',
            title: 'puhua (to speak)',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minä puhun', 'I speak'],
                ['sinä puhut', 'you speak'],
                ['hän puhuu', 'he / she speaks'],
                ['me puhumme', 'we speak'],
                ['te puhutte', 'you speak'],
                ['he puhuvat', 'they speak'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'rule',
            content:
              'Endings: **-n** (minä), **-t** (sinä), **double vowel** (hän), **-mme** (me), **-tte** (te), **-vat / -vät** (he).',
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'conjugation',
                  prompt: 'Conjugate asua ("to live / reside").',
                  answer:
                    'minä asun\nsinä asut\nhän asuu\nme asumme\nte asutte\nhe asuvat',
                  revealOnly: true,
                },
                {
                  type: 'fill-blank',
                  prompt: 'sanoa (to say), hän form: hän ___',
                  answer: 'sanoo',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'Which is "they speak"?',
                  options: ['he puhuu', 'he puhuvat', 'he puhutte'],
                  correctOption: 1,
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'The negative verb (ei)',
        blocks: [
          {
            type: 'prose',
            content:
              'Finnish negation uses a special **negative verb** `ei`, which itself conjugates for person. The main verb then drops to its bare **connegative** stem (the same stem as the minä-form, without the ending).\n\nSo `puhun` ("I speak") → `en puhu` ("I don\'t speak").',
          },
          {
            type: 'table',
            title: 'Negative of puhua',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minä en puhu', "I don't speak"],
                ['sinä et puhu', "you don't speak"],
                ['hän ei puhu', "he / she doesn't speak"],
                ['me emme puhu', "we don't speak"],
                ['te ette puhu', "you don't speak"],
                ['he eivät puhu', "they don't speak"],
              ],
            } satisfies TableContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Fill the negative verb: "minä ___ puhu englantia"',
                  answer: 'en',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'Which is correct for "they don\'t speak"?',
                  options: ['he ei puhu', 'he eivät puhu', 'he eivät puhuvat'],
                  correctOption: 1,
                  note: 'The main verb stays in the bare connegative form `puhu` — never `puhuvat`.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Consonant gradation K-P-T (intro)',
        blocks: [
          {
            type: 'prose',
            content:
              'Many words alternate between a **strong** and a **weak** grade of the consonants **k, p, t** when endings are added. You meet it here lightly; the **full system is in Kappale 7**.\n\nThe most common changes:',
          },
          {
            type: 'gradation',
            content: {
              rows: [
                { strong: 'kk', weak: 'k', example: 'Pekka → Pekan' },
                { strong: 'pp', weak: 'p', example: 'kauppa → kaupan' },
                { strong: 'tt', weak: 't', example: 'tyttö → tytön' },
                { strong: 'k', weak: '– (gone)', example: 'jalka → jalan' },
                { strong: 'p', weak: 'v', example: 'leipä → leivän' },
                { strong: 't', weak: 'd', example: 'katu → kadun' },
              ],
            } satisfies GradationContent,
          },
          {
            type: 'rule',
            content: 'See **Kappale 7** for the complete gradation table and the rules on when each grade appears.',
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'identify',
                  prompt: 'What is the weak grade of "kk"?',
                  options: ['k', 'g', 'kk'],
                  correctOption: 0,
                },
                {
                  type: 'fill-blank',
                  prompt: 'Weak grade in the genitive: katu (street) → kadu___',
                  answer: 'kadun',
                  note: 't → d before the genitive -n.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Question words & yes/no questions',
        blocks: [
          {
            type: 'prose',
            content:
              'Finnish question words start most open questions. For **yes/no** questions there is no word order change like English — instead you attach **`-ko / -kö`** to the **verb** and move it to the front.',
          },
          {
            type: 'table',
            title: 'Common question words',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['kuka', 'who'],
                ['mikä', 'what / which'],
                ['mitä', 'what (partitive)'],
                ['missä', 'where (in)'],
                ['milloin', 'when'],
                ['miksi', 'why'],
                ['miten / kuinka', 'how'],
                ['kenen', 'whose'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'rule',
            content:
              'Yes/no questions: attach **-ko** (back vowels) or **-kö** (front vowels) to the verb and put it first. `Sinä puhut suomea` → **`Puhutko`** `sinä suomea?` ("Do you speak Finnish?").',
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Puhutko', en: 'speak-Q' },
                { fi: 'sinä', en: 'you' },
                { fi: 'suomea?', en: 'Finnish?' },
              ],
              translation: 'Do you speak Finnish?',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Make a yes/no question: "Sinä asut Helsingissä" → ___ sinä Helsingissä?',
                  answer: 'asutko',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'Which question word means "where (in)"?',
                  options: ['milloin', 'missä', 'miksi'],
                  correctOption: 1,
                },
                {
                  type: 'translate',
                  prompt: 'Translate: "Who are you?"',
                  answer: 'Kuka sinä olet? / Kuka olet?',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KAPPALE 3
  // ─────────────────────────────────────────────────────────────────────────
  {
    number: 3,
    title: 'Genitive & gradation in verbs',
    subtitle: 'Kenen tämä on?',
    sections: [
      {
        topic: 'The genitive case (-n)',
        blocks: [
          {
            type: 'prose',
            content:
              'The genitive marks **possession** ("X\'s") and is formed by adding **-n** to the word\'s stem. It also answers `kenen?` ("whose?") and is required by many postpositions.\n\n**Watch for consonant gradation:** because you add `-n`, K-P-T words shift to the **weak** grade (`Pekka` → `Pekan`, `kauppa` → `kaupan`).',
          },
          {
            type: 'table',
            title: 'Nominative → genitive',
            content: {
              headers: ['Nominative', 'Genitive', 'Meaning'],
              rows: [
                ['koira', 'koiran', "dog's"],
                ['talo', 'talon', "house's"],
                ['Pekka', 'Pekan', "Pekka's"],
                ['kauppa', 'kaupan', "shop's"],
                ['Suomi', 'Suomen', "Finland's"],
              ],
            } satisfies TableContent,
          },
          {
            type: 'prose',
            title: 'Possessive pronouns',
            content:
              'The "my / your / his…" words are simply the **genitive of the personal pronouns**:',
          },
          {
            type: 'table',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minun', 'my'],
                ['sinun', 'your'],
                ['hänen', 'his / her'],
                ['meidän', 'our'],
                ['teidän', 'your (pl)'],
                ['heidän', 'their'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Pekan', en: "Pekka's" },
                { fi: 'koira', en: 'dog' },
                { fi: 'on', en: 'is' },
                { fi: 'iso.', en: 'big.' },
              ],
              translation: "Pekka's dog is big.",
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Genitive of "talo" (house):',
                  answer: 'talon',
                },
                {
                  type: 'fill-blank',
                  prompt: 'Genitive of "kauppa" (shop) — mind the gradation:',
                  answer: 'kaupan',
                  note: 'pp → p in the weak grade: kaupan.',
                },
                {
                  type: 'fill-blank',
                  prompt: 'Fill the possessive: "___ koira" (my dog)',
                  answer: 'minun',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'K-P-T gradation in verb type 1',
        blocks: [
          {
            type: 'prose',
            content:
              'Type 1 verbs whose stem contains k, p or t gradate predictably:\n\n- **minä, sinä, me, te** → **weak** grade\n- **hän, he** → **strong** grade\n\nSo the "odd one out" is actually the 3rd person, which keeps the strong grade.',
          },
          {
            type: 'table',
            title: 'nukkua (to sleep) — kk / k',
            content: {
              headers: ['Finnish', 'Grade'],
              rows: [
                ['minä nukun', 'weak (k)'],
                ['sinä nukut', 'weak (k)'],
                ['hän nukkuu', 'strong (kk)'],
                ['me nukumme', 'weak (k)'],
                ['te nukutte', 'weak (k)'],
                ['he nukkuvat', 'strong (kk)'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'lukea (to read), minä form: minä ___',
                  answer: 'luen',
                  note: 'k disappears in the weak grade: lue- → luen.',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'Which is "he/she reads" (strong grade)?',
                  options: ['hän lue', 'hän luee', 'hän lukee'],
                  correctOption: 2,
                },
                {
                  type: 'conjugation',
                  prompt: 'Conjugate tietää ("to know") — t/d gradation.',
                  answer:
                    'minä tiedän\nsinä tiedät\nhän tietää\nme tiedämme\nte tiedätte\nhe tietävät',
                  revealOnly: true,
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KAPPALE 4
  // ─────────────────────────────────────────────────────────────────────────
  {
    number: 4,
    title: 'Having & the partitive',
    subtitle: 'Minulla on koira',
    sections: [
      {
        topic: 'Possession: minulla on',
        blocks: [
          {
            type: 'prose',
            content:
              'Finnish has no verb "to have". Instead it says **"at me is…"**: the owner takes the **adessive** ending `-lla / -llä`, followed by `on` (or `ovat` for plural things).\n\nNegative: `minulla **ei ole** koiraa` ("I don\'t have a dog") — note the object goes **partitive** in the negative.',
          },
          {
            type: 'table',
            title: '"to have"',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minulla on', 'I have'],
                ['sinulla on', 'you have'],
                ['hänellä on', 'he / she has'],
                ['meillä on', 'we have'],
                ['teillä on', 'you have'],
                ['heillä on', 'they have'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Minulla', en: 'I-at' },
                { fi: 'on', en: 'is' },
                { fi: 'koira.', en: 'dog.' },
              ],
              translation: 'I have a dog.',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Fill the blank: "Minulla ___ koira." (I have a dog)',
                  answer: 'on',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'How do you say "I have"?',
                  options: ['minä olen', 'minun on', 'minulla on'],
                  correctOption: 2,
                },
                {
                  type: 'translate',
                  prompt: 'Translate: "Do you have a car?"',
                  answer: 'Onko sinulla auto? / Onko sinulla auto',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'The partitive case (intro)',
        blocks: [
          {
            type: 'prose',
            content:
              'The partitive is one of the most important — and trickiest — Finnish cases. It expresses **partial / uncounted amounts**, is used after **numbers**, in **negative sentences**, and is demanded by certain verbs (next topic).\n\nThe basic ending is **-a / -ä**, but the exact form depends on the word:',
          },
          {
            type: 'table',
            title: 'Forming the partitive',
            content: {
              headers: ['Type', 'Ending', 'Example'],
              rows: [
                ['Ends in one vowel', '+ a / ä', 'koira → koiraa'],
                ['Ends in two vowels', '+ ta / tä', 'maa → maata'],
                ['Ends in -e', '+ tta / ttä', 'huone → huonetta'],
                ['Ends in consonant', '+ ta / tä', 'mies → miestä'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'rule',
            content:
              'After a number greater than one, the counted noun is **singular partitive**: `kaksi koiraa` ("two dogs"), `kolme taloa` ("three houses").',
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Partitive of "koira" (dog):',
                  answer: 'koiraa',
                },
                {
                  type: 'fill-blank',
                  prompt: 'After a number: "kaksi ___" (two houses, talo)',
                  answer: 'taloa',
                },
                {
                  type: 'identify',
                  prompt: 'Which sentence needs the partitive?',
                  options: [
                    'Minulla on koira. (I have a dog)',
                    'Minulla ei ole koiraa. (I don\'t have a dog)',
                  ],
                  correctOption: 1,
                  note: 'Negative sentences take a partitive object.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Partitive verbs',
        blocks: [
          {
            type: 'prose',
            content:
              'Some verbs **always** take their object in the partitive, regardless of amount. These just have to be learned. Common ones from this chapter:',
          },
          {
            type: 'table',
            content: {
              headers: ['Verb', 'Meaning', 'Example'],
              rows: [
                ['rakastaa', 'to love', 'Rakastan sinua.'],
                ['tarvita', 'to need', 'Tarvitsen apua.'],
                ['odottaa', 'to wait for', 'Odotan bussia.'],
                ['auttaa', 'to help', 'Autan äitiä.'],
                ['katsoa', 'to watch', 'Katson televisiota.'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Partitive of "sinä" after rakastaa: "Rakastan ___"',
                  answer: 'sinua',
                },
                {
                  type: 'translate',
                  prompt: 'Translate: "I love you."',
                  answer: 'Rakastan sinua. / Minä rakastan sinua.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KAPPALE 5
  // ─────────────────────────────────────────────────────────────────────────
  {
    number: 5,
    title: 'Verb types 1–5',
    subtitle: 'Mitä sinä teet?',
    sections: [
      {
        topic: 'The five verb types',
        blocks: [
          {
            type: 'prose',
            content:
              'Every Finnish verb belongs to one of **five types**, decided by the **infinitive ending**. The type tells you how to find the stem before adding personal endings. Learning to spot the type from the ending is the key skill.',
          },
          {
            type: 'table',
            title: 'How to recognise each type',
            content: {
              headers: ['Type', 'Infinitive ends in', 'Example', 'minä-form'],
              rows: [
                ['1', 'two vowels', 'puhua', 'puhun'],
                ['2', '-da / -dä', 'juoda', 'juon'],
                ['3', '-la, -na, -ra, -sta', 'tulla', 'tulen'],
                ['4', '-ata / -ätä (etc.)', 'haluta', 'haluan'],
                ['5', '-ita / -itä', 'tarvita', 'tarvitsen'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'rule',
            content:
              '**Type 2** drops `-da/-dä` and adds endings directly (`juon`, `juot`, `juo`). **Type 3** drops the last two letters and inserts `-e-` (`tule-` → `tulen`, `tulee`). **Type 4** drops the `-t-` (`halua-` → `haluan`). **Type 5** drops `-ta/-tä` and inserts `-tse-` (`tarvitse-` → `tarvitsen`).',
          },
        ],
      },
      {
        topic: 'Type 2 & Type 3 in detail',
        blocks: [
          {
            type: 'table',
            title: 'juoda (type 2, to drink)',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minä juon', 'I drink'],
                ['sinä juot', 'you drink'],
                ['hän juo', 'he / she drinks'],
                ['me juomme', 'we drink'],
                ['te juotte', 'you drink'],
                ['he juovat', 'they drink'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'prose',
            content: 'Notice type 2 has **no doubled vowel** in the `hän` form: `hän juo`, not `juoo`.',
          },
          {
            type: 'table',
            title: 'mennä (type 3, to go)',
            content: {
              headers: ['Finnish', 'English'],
              rows: [
                ['minä menen', 'I go'],
                ['sinä menet', 'you go'],
                ['hän menee', 'he / she goes'],
                ['me menemme', 'we go'],
                ['te menette', 'you go'],
                ['he menevät', 'they go'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'prose',
            content: 'Type 3 always has the inserted **-e-**, so the `hän` form ends in `-ee` (`menee`, `tulee`).',
          },
        ],
      },
      {
        topic: 'Test the verb types',
        blocks: [
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'identify',
                  prompt: 'Which type is "tulla" (to come)?',
                  options: ['Type 1', 'Type 2', 'Type 3'],
                  correctOption: 2,
                  note: 'Ends in -la → type 3.',
                },
                {
                  type: 'identify',
                  prompt: 'Which type is "syödä" (to eat)?',
                  options: ['Type 1', 'Type 2', 'Type 5'],
                  correctOption: 1,
                  note: 'Ends in -dä → type 2.',
                },
                {
                  type: 'fill-blank',
                  prompt: 'haluta (type 4, to want), minä form: minä ___',
                  answer: 'haluan',
                },
                {
                  type: 'fill-blank',
                  prompt: 'tarvita (type 5, to need), minä form: minä ___',
                  answer: 'tarvitsen',
                },
                {
                  type: 'conjugation',
                  prompt: 'Conjugate mennä (type 3, "to go").',
                  answer:
                    'minä menen\nsinä menet\nhän menee\nme menemme\nte menette\nhe menevät',
                  revealOnly: true,
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KAPPALE 6
  // ─────────────────────────────────────────────────────────────────────────
  {
    number: 6,
    title: 'Location cases, plurals & imperative',
    subtitle: 'Kotona Puistotiellä — Pedro muuttaa',
    sections: [
      {
        topic: 'Internal location cases (missä / mistä / mihin)',
        blocks: [
          {
            type: 'prose',
            content:
              'Where English uses prepositions ("in", "from", "into"), Finnish uses **case endings**. The three **internal** location cases describe being inside, coming out of, and going into a place. Each answers its own question word:',
          },
          {
            type: 'table',
            title: 'The three internal location cases',
            content: {
              headers: ['Question', 'Case', 'Ending', 'Meaning'],
              rows: [
                ['missä?', 'inessive', '-ssa / -ssä', 'in / inside'],
                ['mistä?', 'elative', '-sta / -stä', 'from / out of'],
                ['mihin?', 'illative', '-Vn / -hVn / -seen', 'into'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'rule',
            content:
              'All three endings obey **vowel harmony** (`-ssa` / `-ssä`, `-sta` / `-stä`). They attach to the same stem as the genitive, so **consonant gradation** applies: `kauppa` → `kaupassa`.',
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Asun', en: 'I-live' },
                { fi: 'Helsingissä.', en: 'Helsinki-in.' },
              ],
              translation: 'I live in Helsinki.',
            } satisfies ExampleContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Tulen', en: 'I-come' },
                { fi: 'Suomesta.', en: 'Finland-from.' },
              ],
              translation: 'I come from Finland.',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: '"in the house": talo → talo___',
                  answer: 'talossa',
                },
                {
                  type: 'fill-blank',
                  prompt: '"from the house": talo → talo___',
                  answer: 'talosta',
                },
                {
                  type: 'identify',
                  prompt: 'Which case answers the question "missä?"',
                  options: ['inessive (-ssa/-ssä)', 'elative (-sta/-stä)', 'illative (into)'],
                  correctOption: 0,
                },
                {
                  type: 'fill-blank',
                  prompt: '"I live in Finland": Asun ___',
                  answer: 'Suomessa',
                  note: 'Inessive of Suomi (stem Suome-) → Suomessa.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'The illative (mihin / "into")',
        blocks: [
          {
            type: 'prose',
            content:
              'The illative ("into / to") is the trickiest of the three, because its ending changes shape depending on how the word ends. Unlike the inessive and elative, it usually keeps the **strong** grade.',
          },
          {
            type: 'table',
            title: 'Forming the illative',
            content: {
              headers: ['Word ends in', 'Ending', 'Example'],
              rows: [
                ['one short vowel', 'double the vowel + n', 'talo → taloon'],
                ['long vowel / diphthong', '-h + vowel + n', 'maa → maahan'],
                ['-e (and longer words)', '-seen', 'huone → huoneeseen'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Menen', en: 'I-go' },
                { fi: 'kauppaan.', en: 'shop-into.' },
              ],
              translation: 'I am going to the shop.',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: '"into the house": talo → talo___',
                  answer: 'taloon',
                },
                {
                  type: 'fill-blank',
                  prompt: '"to Helsinki": Helsinki → Helsinki___',
                  answer: 'Helsinkiin',
                },
                {
                  type: 'multiple-choice',
                  prompt: '"I am going home" — Menen ___',
                  options: ['kotissa', 'kotoa', 'kotiin'],
                  correctOption: 2,
                  note: '"kotiin" = (to) home. "kotona" = at home, "kotoa" = from home.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Nominative plural (-t)',
        blocks: [
          {
            type: 'prose',
            content:
              'To make a noun plural as the **subject** of a sentence, add **-t** to the genitive stem. Because the `-t` closes the syllable, **consonant gradation** moves to the weak grade (`kauppa` → `kaupat`).\n\nThis `-t` plural is **only** the nominative (subject) plural — other cases form their plural with `-i-`, which comes later.',
          },
          {
            type: 'table',
            title: 'Singular → plural',
            content: {
              headers: ['Singular', 'Plural', 'Meaning'],
              rows: [
                ['talo', 'talot', 'houses'],
                ['kirja', 'kirjat', 'books'],
                ['opiskelija', 'opiskelijat', 'students'],
                ['kauppa', 'kaupat', 'shops'],
                ['tyttö', 'tytöt', 'girls'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Koirat', en: 'dogs' },
                { fi: 'ovat', en: 'are' },
                { fi: 'puistossa.', en: 'park-in.' },
              ],
              translation: 'The dogs are in the park.',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Plural of "talo":',
                  answer: 'talot',
                },
                {
                  type: 'fill-blank',
                  prompt: 'Plural of "kauppa" (mind the gradation):',
                  answer: 'kaupat',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'Which is the subject plural "the cats"?',
                  options: ['kissoja', 'kissat', 'kissoissa'],
                  correctOption: 1,
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Existential sentences (there is / there are)',
        blocks: [
          {
            type: 'prose',
            content:
              'To say **"there is / there are"** something somewhere, Finnish puts the **place first** (in a location case), then the verb **`on`**, then the thing. The verb stays **`on`** even when the thing is plural.\n\nThe thing is often **partitive** (for an uncountable or indefinite amount), and **always partitive in the negative**.',
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Helsingissä', en: 'Helsinki-in' },
                { fi: 'on', en: 'is' },
                { fi: 'metro.', en: 'a-metro.' },
              ],
              translation: 'There is a metro in Helsinki.',
            } satisfies ExampleContent,
          },
          {
            type: 'rule',
            content:
              'Word order is the opposite of English: **place → on → thing**. The negative uses **`ei ole`** + partitive: `Kaupassa ei ole maitoa` ("There is no milk in the shop").',
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: '"There is a book in the bag": Laukussa ___ kirja.',
                  answer: 'on',
                },
                {
                  type: 'identify',
                  prompt: 'In an existential sentence, where does the place go?',
                  options: ['first (before the verb)', 'last (after the thing)'],
                  correctOption: 0,
                },
                {
                  type: 'translate',
                  prompt: 'Translate: "There is a sauna in Finland."',
                  answer: 'Suomessa on sauna.',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'Demonstrative pronouns (tämä / tuo / se)',
        blocks: [
          {
            type: 'prose',
            content:
              'Finnish has three demonstratives, chosen by **distance** from the speaker:\n\n- **tämä** — *this* (near me)\n- **tuo** — *that* (further away, but visible)\n- **se** — *it / that* (already known, or out of sight). In everyday speech `se` also does the job of "the".',
          },
          {
            type: 'table',
            title: 'Singular & plural',
            content: {
              headers: ['Singular', 'Plural', 'Meaning'],
              rows: [
                ['tämä', 'nämä', 'this / these'],
                ['tuo', 'nuo', 'that / those'],
                ['se', 'ne', 'it/that / they/those'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Mikä', en: 'what' },
                { fi: 'tuo', en: 'that' },
                { fi: 'on?', en: 'is?' },
              ],
              translation: 'What is that?',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'multiple-choice',
                  prompt: 'Which means "this" (right next to you)?',
                  options: ['se', 'tuo', 'tämä'],
                  correctOption: 2,
                },
                {
                  type: 'fill-blank',
                  prompt: 'Plural of "tämä" (these):',
                  answer: 'nämä',
                },
                {
                  type: 'identify',
                  prompt: 'Which would you use for something already known or out of sight?',
                  options: ['tämä', 'tuo', 'se'],
                  correctOption: 2,
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
      {
        topic: 'The imperative (sinä-form commands)',
        blocks: [
          {
            type: 'prose',
            content:
              'To give a command to one person ("you"), take the verb\'s **minä-form**, drop the **-n**, and that is the imperative. Whatever consonant gradation the minä-form has, the imperative keeps.\n\n`puhun` → **Puhu!** ("Speak!"), `tulen` → **Tule!** ("Come!").',
          },
          {
            type: 'table',
            title: 'Positive imperative',
            content: {
              headers: ['Verb', 'minä-form', 'Imperative', 'Meaning'],
              rows: [
                ['puhua', 'puhun', 'Puhu!', 'Speak!'],
                ['tulla', 'tulen', 'Tule!', 'Come!'],
                ['syödä', 'syön', 'Syö!', 'Eat!'],
                ['mennä', 'menen', 'Mene!', 'Go!'],
                ['odottaa', 'odotan', 'Odota!', 'Wait!'],
              ],
            } satisfies TableContent,
          },
          {
            type: 'rule',
            content:
              'Negative command: **`älä`** + the same form. `Älä puhu!` ("Don\'t speak!"), `Älä mene!` ("Don\'t go!").',
          },
          {
            type: 'example',
            content: {
              words: [
                { fi: 'Tule', en: 'come' },
                { fi: 'tänne!', en: 'here-to!' },
              ],
              translation: 'Come here!',
            } satisfies ExampleContent,
          },
          {
            type: 'exercise',
            content: {
              items: [
                {
                  type: 'fill-blank',
                  prompt: 'Imperative of "tulla" (minä tulen):',
                  answer: 'Tule',
                },
                {
                  type: 'fill-blank',
                  prompt: 'Imperative of "odottaa" (minä odotan):',
                  answer: 'Odota',
                },
                {
                  type: 'multiple-choice',
                  prompt: 'How do you say "Don\'t go!"?',
                  options: ['Ei mene!', 'Älä mene!', 'Älä menet!'],
                  correctOption: 1,
                },
                {
                  type: 'fill-blank',
                  prompt: 'Imperative of "lukea" (minä luen) — keeps the weak grade:',
                  answer: 'Lue',
                },
              ],
            } satisfies ExerciseContent,
          },
        ],
      },
    ],
  },
]

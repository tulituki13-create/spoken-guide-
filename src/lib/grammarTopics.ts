
export interface GrammarTopic {
  name: string;
  category: string;
  translatedName: string;
  section: "Grammar" | "Spoken Practice" | "Learner Focus";
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  // Grammar - Beginner
  { name: "Nouns: Proper vs. Common", category: "Grammar: Beginner", translatedName: "নামবাচক বনাম সাধারণ বিশেষ্য", section: "Grammar" },
  { name: "Pronouns: Subject (I, you, he...)", category: "Grammar: Beginner", translatedName: "কর্তা সর্বনাম", section: "Grammar" },
  { name: "Pronouns: Object (me, him, her...)", category: "Grammar: Beginner", translatedName: "কর্ম সর্বনাম", section: "Grammar" },
  { name: "Possessive Adjectives (my, your...)", category: "Grammar: Beginner", translatedName: "মালিকানাসূচক বিশেষণ", section: "Grammar" },
  { name: "Possessive Pronouns (mine, yours...)", category: "Grammar: Beginner", translatedName: "মালিকানাসূচক সর্বনাম", section: "Grammar" },
  { name: "Singular vs. Plural Nouns", category: "Grammar: Beginner", translatedName: "একবচন বনাম বহুবচন বিশেষ্য", section: "Grammar" },
  { name: "Regular Plurals ending in -s/-es", category: "Grammar: Beginner", translatedName: "সাধারণ বহুবচন", section: "Grammar" },
  { name: "Irregular Plural Nouns", category: "Grammar: Beginner", translatedName: "অসাধারণ বহুবচন বিশেষ্য", section: "Grammar" },
  { name: "Verbs: To Be - Present tense (am/is/are)", category: "Grammar: Beginner", translatedName: "বর্তমান কালে To Be Verb", section: "Grammar" },
  { name: "Verbs: To Be - Past tense (was/were)", category: "Grammar: Beginner", translatedName: "অতীত কালে To Be Verb", section: "Grammar" },
  { name: "Verbs: To Have - Present (have/has)", category: "Grammar: Beginner", translatedName: "বর্তমান কালে To Have Verb", section: "Grammar" },
  { name: "Present Simple: Positive Sentences", category: "Grammar: Beginner", translatedName: "সাধারণ বর্তমান কাল: হ্যাঁ-বোধক", section: "Grammar" },
  { name: "Present Simple: Negative Sentences", category: "Grammar: Beginner", translatedName: "সাধারণ বর্তমান কাল: না-বোধক", section: "Grammar" },
  { name: "Present Simple: Questions & Answers", category: "Grammar: Beginner", translatedName: "সাধারণ বর্তমান কাল: প্রশ্ন ও উত্তর", section: "Grammar" },
  { name: "Present Continuous: Actions now", category: "Grammar: Beginner", translatedName: "ঘটমান বর্তমান কাল", section: "Grammar" },
  { name: "Past Simple with Regular Verbs", category: "Grammar: Beginner", translatedName: "অতীত কাল: সাধারণ ক্রিয়া", section: "Grammar" },
  { name: "Past Simple with Irregular Verbs", category: "Grammar: Beginner", translatedName: "অতীত কাল: ব্যতিক্রমী ক্রিয়া", section: "Grammar" },
  { name: "Future Simple with 'will'", category: "Grammar: Beginner", translatedName: "সাধারণ ভবিষ্যৎ কাল", section: "Grammar" },
  { name: "Future with 'going to'", category: "Grammar: Beginner", translatedName: "পরিকল্পিত ভবিষ্যৎ কাল", section: "Grammar" },
  { name: "Articles: A / An", category: "Grammar: Beginner", translatedName: "অনির্দিষ্ট অনির্দেশক", section: "Grammar" },
  { name: "Articles: The", category: "Grammar: Beginner", translatedName: "নির্দিষ্ট নির্দেশক", section: "Grammar" },
  { name: "Adjectives: Descriptive", category: "Grammar: Beginner", translatedName: "গুণবাচক বিশেষণ", section: "Grammar" },
  { name: "Demonstratives: This, That, These, Those", category: "Grammar: Beginner", translatedName: "নির্দেশক সর্বনাম", section: "Grammar" },
  { name: "Prepositions of Place: In, On, At", category: "Grammar: Beginner", translatedName: "স্থানের অব্যয়", section: "Grammar" },
  { name: "Prepositions of Time: In, On, At", category: "Grammar: Beginner", translatedName: "সময়ের অব্যয়", section: "Grammar" },
  { name: "Conjunctions: And, But, Or", category: "Grammar: Beginner", translatedName: "সংযোজক অব্যয়", section: "Grammar" },
  { name: "Question Words: Who, What, Where...", category: "Grammar: Beginner", translatedName: "প্রশ্নবোধক শব্দ", section: "Grammar" },
  { name: "Adverbs of Frequency (always, often...)", category: "Grammar: Beginner", translatedName: "ঘনত্ববাচক ক্রিয়া বিশেষণ", section: "Grammar" },
  { name: "There is vs. There are", category: "Grammar: Beginner", translatedName: "স্থান বা অস্তিত্ব জ্ঞাপন", section: "Grammar" },
  { name: "Imperatives: Orders & Instructions", category: "Grammar: Beginner", translatedName: "আদেশ ও নির্দেশাবলী", section: "Grammar" },
  { name: "Countable vs. Uncountable Overview", category: "Grammar: Beginner", translatedName: "গণনাযোগ্য বনাম অগণনযোগ্য", section: "Grammar" },
  { name: "Much vs. Many", category: "Grammar: Beginner", translatedName: "পরিমাণ বনাম সংখ্যা", section: "Grammar" },
  { name: "Some vs. Any", category: "Grammar: Beginner", translatedName: "কিছু বা যেকোনো", section: "Grammar" },
  { name: "Simple Yes/No Questions", category: "Grammar: Beginner", translatedName: "সাধারণ হ্যাঁ/না প্রশ্ন", section: "Grammar" },
  { name: "Subject-Verb Agreement Basics", category: "Grammar: Beginner", translatedName: "কর্তা ও ক্রিয়ার মূল সামঞ্জস্য", section: "Grammar" },

  // Grammar - Intermediate
  { name: "Present Perfect: Experience", category: "Grammar: Intermediate", translatedName: "পুরাঘটিত বর্তমান কাল - অভিজ্ঞতা", section: "Grammar" },
  { name: "Present Perfect: For vs. Since", category: "Grammar: Intermediate", translatedName: "পুরাঘটিত বর্তমান কাল - সময়কাল", section: "Grammar" },
  { name: "Present Perfect Continuous", category: "Grammar: Intermediate", translatedName: "পুরাঘটিত ঘটমান বর্তমান কাল", section: "Grammar" },
  { name: "Past Continuous: Interrupted actions", category: "Grammar: Intermediate", translatedName: "ঘটমান অতীত কাল - বিঘ্নিত কাজ", section: "Grammar" },
  { name: "Past Perfect: Narrative sequence", category: "Grammar: Intermediate", translatedName: "পুরাঘটিত অতীত কাল", section: "Grammar" },
  { name: "Used to vs. Would for past habits", category: "Grammar: Intermediate", translatedName: "অতীতকালের অভ্যাস", section: "Grammar" },
  { name: "Conditionals: Zero Conditional", category: "Grammar: Intermediate", translatedName: "সাধারণ সত্যের শর্ত", section: "Grammar" },
  { name: "Conditionals: First Conditional", category: "Grammar: Intermediate", translatedName: "ভবিষ্যতের সম্ভাব্য শর্ত", section: "Grammar" },
  { name: "Conditionals: Second Conditional", category: "Grammar: Intermediate", translatedName: "অবাস্তব বা কাল্পনিক শর্ত", section: "Grammar" },
  { name: "Modal Verbs of Ability: Can, Could...", category: "Grammar: Intermediate", translatedName: "সমর্থতাসূচক মডাল", section: "Grammar" },
  { name: "Modal Verbs of Obligation: Must, Have to...", category: "Grammar: Intermediate", translatedName: "বাধ্যবাধকতাসূচক মডাল", section: "Grammar" },
  { name: "Modal Verbs of Permission & Advice", category: "Grammar: Intermediate", translatedName: "অনুমতি ও পরামর্শের মডাল", section: "Grammar" },
  { name: "Passive Voice: Present Simple", category: "Grammar: Intermediate", translatedName: "কর্মবাচ্য: সাধারণ বর্তমান", section: "Grammar" },
  { name: "Passive Voice: Past Simple", category: "Grammar: Intermediate", translatedName: "কর্মবাচ্য: সাধারণ অতীত", section: "Grammar" },
  { name: "Passive Voice: Present Perfect", category: "Grammar: Intermediate", translatedName: "কর্মবাচ্য: পুরাঘটিত বর্তমান", section: "Grammar" },
  { name: "Gerunds vs. Infinitives Overview", category: "Grammar: Intermediate", translatedName: "জেরান্ড বনাম ইনফিনিটিভ", section: "Grammar" },
  { name: "Verbs followed only by Gerunds", category: "Grammar: Intermediate", translatedName: "ক্রিয়ার পর জেরান্ড", section: "Grammar" },
  { name: "Verbs followed only by Infinitives", category: "Grammar: Intermediate", translatedName: "ক্রিয়ার পর ইনফিনিটিভ", section: "Grammar" },
  { name: "Direct vs. Indirect Speech Basics", category: "Grammar: Intermediate", translatedName: "প্রত্যক্ষ ও পরোক্ষ উক্তি", section: "Grammar" },
  { name: "Reported statements", category: "Grammar: Intermediate", translatedName: "উক্তি পরিবর্তন: বিবৃতি", section: "Grammar" },
  { name: "Reported questions", category: "Grammar: Intermediate", translatedName: "উক্তি পরিবর্তন: প্রশ্ন", section: "Grammar" },
  { name: "Relative Clauses: Defining (who, which, that)", category: "Grammar: Intermediate", translatedName: "সম্পর্কযুক্ত বাক্যাংশ (সংজ্ঞায়িত)", section: "Grammar" },
  { name: "Relative Clauses: Non-defining", category: "Grammar: Intermediate", translatedName: "সম্পর্কযুক্ত বাক্যাংশ (অসংজ্ঞায়িত)", section: "Grammar" },
  { name: "Comparatives & Superlatives Exceptions", category: "Grammar: Intermediate", translatedName: "তুলনামূলক ও সর্বোচ্চ রূপ", section: "Grammar" },
  { name: "As... as for equal comparisons", category: "Grammar: Intermediate", translatedName: "সমান তুলনা রূপ", section: "Grammar" },
  { name: "Too vs. Enough", category: "Grammar: Intermediate", translatedName: "খুব বনাম যথেষ্ট", section: "Grammar" },
  { name: "So vs. Such", category: "Grammar: Intermediate", translatedName: "এত বনাম এমন", section: "Grammar" },
  { name: "Phrasal Verbs: Separable", category: "Grammar: Intermediate", translatedName: "বিচ্ছিন্নযোগ্য ফ্রেজাল ভার্ব", section: "Grammar" },
  { name: "Phrasal Verbs: Inseparable", category: "Grammar: Intermediate", translatedName: "অবিচ্ছিন্নযোগ্য ফ্রেজাল ভার্ব", section: "Grammar" },
  { name: "Prepositions of Movement", category: "Grammar: Intermediate", translatedName: "চলাচলের অব্যয়", section: "Grammar" },
  { name: "Adverbs of Manner (quickly, well...)", category: "Grammar: Intermediate", translatedName: "ধরনবাচক ক্রিয়া বিশেষণ", section: "Grammar" },
  { name: "Adverbs of Degree (extremely, quite...)", category: "Grammar: Intermediate", translatedName: "মাত্রাবাচক ক্রিয়া বিশেষণ", section: "Grammar" },
  { name: "Either / Or, Neither / Nor", category: "Grammar: Intermediate", translatedName: "হয়...নয়তো, না...না", section: "Grammar" },
  { name: "Question Tags: Positive to Negative", category: "Grammar: Intermediate", translatedName: "প্রশ্ন ট্যাগ: ইতিবাচক থেকে নেতিবাচক", section: "Grammar" },
  { name: "Question Tags: Negative to Positive", category: "Grammar: Intermediate", translatedName: "প্রশ্ন ট্যাগ: নেতিবাচক থেকে ইতিবাচক", section: "Grammar" },

  // Grammar - Advanced
  { name: "Conditionals: Third Conditional", category: "Grammar: Advanced", translatedName: "অসম্ভব অতীত শর্ত", section: "Grammar" },
  { name: "Mixed Conditionals", category: "Grammar: Advanced", translatedName: "মিশ্র শর্ত", section: "Grammar" },
  { name: "Past Perfect Continuous", category: "Grammar: Advanced", translatedName: "পুরাঘটিত ঘটমান অতীত কাল", section: "Grammar" },
  { name: "Future Perfect", category: "Grammar: Advanced", translatedName: "পুরাঘটিত ভবিষ্যৎ কাল", section: "Grammar" },
  { name: "Future Continuous", category: "Grammar: Advanced", translatedName: "ঘটমান ভবিষ্যৎ কাল", section: "Grammar" },
  { name: "Modal Verbs of Deduction in the Past", category: "Grammar: Advanced", translatedName: "অতীতে অনুমানের মডাল", section: "Grammar" },
  { name: "Passive Voice in Advanced Tenses", category: "Grammar: Advanced", translatedName: "কর্মবাচ্য (উন্নত কাল)", section: "Grammar" },
  { name: "Causative Verbs (Have/Get something done)", category: "Grammar: Advanced", translatedName: "প্রযোজক ক্রিয়া", section: "Grammar" },
  { name: "Reported Speech with Modals", category: "Grammar: Advanced", translatedName: "মডাল সহ পরোক্ষ উক্তি", section: "Grammar" },
  { name: "Inversion with negative adverbs", category: "Grammar: Advanced", translatedName: "নেতিবাচক ক্রিয়াবিশেষণে উল্টানো", section: "Grammar" },
  { name: "Cleft Sentences (It was X who...)", category: "Grammar: Advanced", translatedName: "জোর প্রদানমূলক বাক্য", section: "Grammar" },
  { name: "Participle Clauses", category: "Grammar: Advanced", translatedName: "অসমাপিকা ক্রিয়া বাক্যাংশ", section: "Grammar" },
  { name: "Future Perfect Continuous", category: "Grammar: Advanced", translatedName: "পুরাঘটিত ঘটমান ভবিষ্যৎ কাল", section: "Grammar" },
  { name: "Subjunctive Mood (I suggest that he go...)", category: "Grammar: Advanced", translatedName: "সংশয় বা ইচ্ছাবাচক ভাব", section: "Grammar" },
  { name: "Advanced Phrasal Verbs & Idioms", category: "Grammar: Advanced", translatedName: "উন্নত ফ্রেজাল ভার্ব ও বাগধারা", section: "Grammar" },
  { name: "Noun Clauses", category: "Grammar: Advanced", translatedName: "বিশেষ্য বাক্যাংশ", section: "Grammar" },
  { name: "Adverbial Clauses of Contrast", category: "Grammar: Advanced", translatedName: "বিপরীতার্থক ক্রিয়াবিশেষণ বাক্যাংশ", section: "Grammar" },
  { name: "Adverbial Clauses of Reason & Result", category: "Grammar: Advanced", translatedName: "কারণ ও ফলাফলবাচক বাক্যাংশ", section: "Grammar" },
  { name: "Double Comparatives (The more, the better)", category: "Grammar: Advanced", translatedName: "দ্বৈত তুলনামূলক রূপ", section: "Grammar" },
  { name: "Expressing Regret: Wish / If only", category: "Grammar: Advanced", translatedName: "অনুশোচনা প্রকাশ: ইচ্ছা", section: "Grammar" },
  { name: "Would Rather / Had Better", category: "Grammar: Advanced", translatedName: "বরং / সেটাই ভালো", section: "Grammar" },
  { name: "Dependent Prepositions", category: "Grammar: Advanced", translatedName: "নির্ভরশীল অব্যয়", section: "Grammar" },
  { name: "Articles for Abstract Nouns", category: "Grammar: Advanced", translatedName: "বিমূর্ত বিশেষ্যের জন্য নির্দেশক", section: "Grammar" },
  { name: "Complex Gerund and Infinitive structures", category: "Grammar: Advanced", translatedName: "জটিল জেরান্ড ও ইনফিনিটিভ গঠন", section: "Grammar" },
  { name: "Ellipsis & Substitution", category: "Grammar: Advanced", translatedName: "শব্দলোপ ও প্রতিস্থাপন", section: "Grammar" },
  { name: "Discourse Markers for Speech", category: "Grammar: Advanced", translatedName: "কথোপকথন নির্দেশক শব্দ", section: "Grammar" },
  { name: "Prefixes & Suffixes building meaning", category: "Grammar: Advanced", translatedName: "উপসর্গ ও প্রত্যয়", section: "Grammar" },
  { name: "Phrasal Nouns", category: "Grammar: Advanced", translatedName: "ফ্রেজাল বিশেষ্য", section: "Grammar" },
  { name: "Indirect/Embedded Questions", category: "Grammar: Advanced", translatedName: "পরোক্ষ/অন্তর্ভুক্ত প্রশ্ন", section: "Grammar" },
  { name: "Advanced Relative Pronouns (whom, whose)", category: "Grammar: Advanced", translatedName: "উন্নত সম্পর্কযুক্ত সর্বনাম", section: "Grammar" },

  // --- SPOKEN PRACTICE ---
  { name: "স্কুলের ছাত্র-ছাত্রী", category: "ছাত্র-ছাত্রী (Students)", translatedName: "School Students", section: "Learner Focus" },
  { name: "কলেজের ছাত্র-ছাত্রী", category: "ছাত্র-ছাত্রী (Students)", translatedName: "College Students", section: "Learner Focus" },
  { name: "বিশ্ববিদ্যালয়ের শিক্ষার্থী", category: "ছাত্র-ছাত্রী (Students)", translatedName: "University Students", section: "Learner Focus" },
  { name: "ইংলিশ মিডিয়াম শিক্ষার্থী", category: "ছাত্র-ছাত্রী (Students)", translatedName: "English Medium Students", section: "Learner Focus" },
  { name: "চাকরির প্রস্তুতি নেওয়া শিক্ষার্থী", category: "ছাত্র-ছাত্রী (Students)", translatedName: "Job Preparation Students", section: "Learner Focus" },
  { name: "বিদেশে পড়তে আগ্রহী শিক্ষার্থী", category: "ছাত্র-ছাত্রী (Students)", translatedName: "Study Abroad Aspirants", section: "Learner Focus" },

  { name: "ফ্রেশ গ্র্যাজুয়েট", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "Fresh Graduates", section: "Learner Focus" },
  { name: "BCS প্রার্থী", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "BCS Candidates", section: "Learner Focus" },
  { name: "ব্যাংক চাকরিপ্রার্থী", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "Bank Job Seekers", section: "Learner Focus" },
  { name: "সরকারি চাকরিপ্রার্থী", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "Govt Job Seekers", section: "Learner Focus" },
  { name: "বেসরকারি চাকরিপ্রার্থী", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "Private Job Seekers", section: "Learner Focus" },
  { name: "NGO চাকরিপ্রার্থী", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "NGO Job Seekers", section: "Learner Focus" },
  { name: "ইন্টারভিউ প্রস্তুতকারীরা", category: "চাকরিপ্রার্থী (Job Seekers)", translatedName: "Interview Candidates", section: "Learner Focus" },

  { name: "অফিস এক্সিকিউটিভ", category: "চাকরিজীবী (Professionals)", translatedName: "Office Executive", section: "Learner Focus" },
  { name: "ম্যানেজার", category: "চাকরিজীবী (Professionals)", translatedName: "Manager", section: "Learner Focus" },
  { name: "HR কর্মকর্তা", category: "চাকরিজীবী (Professionals)", translatedName: "HR Officer", section: "Learner Focus" },
  { name: "ব্যাংকার", category: "চাকরিজীবী (Professionals)", translatedName: "Banker", section: "Learner Focus" },
  { name: "শিক্ষক", category: "চাকরিজীবী (Professionals)", translatedName: "Teacher", section: "Learner Focus" },
  { name: "ডাক্তার", category: "চাকরিজীবী (Professionals)", translatedName: "Doctor", section: "Learner Focus" },
  { name: "ইঞ্জিনিয়ার", category: "চাকরিজীবী (Professionals)", translatedName: "Engineer", section: "Learner Focus" },
  { name: "আইনজীবী", category: "চাকরিজীবী (Professionals)", translatedName: "Lawyer", section: "Learner Focus" },
  { name: "সাংবাদিক", category: "চাকরিজীবী (Professionals)", translatedName: "Journalist", section: "Learner Focus" },
  { name: "কর্পোরেট কর্মী", category: "চাকরিজীবী (Professionals)", translatedName: "Corporate Worker", section: "Learner Focus" },

  { name: "গ্রাফিক ডিজাইনার", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "Graphic Designer", section: "Learner Focus" },
  { name: "ওয়েব ডেভেলপার", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "Web Developer", section: "Learner Focus" },
  { name: "অ্যাপ ডেভেলপার", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "App Developer", section: "Learner Focus" },
  { name: "ডিজিটাল মার্কেটার", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "Digital Marketer", section: "Learner Focus" },
  { name: "SEO এক্সপার্ট", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "SEO Expert", section: "Learner Focus" },
  { name: "কনটেন্ট রাইটার", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "Content Writer", section: "Learner Focus" },
  { name: "ভিডিও এডিটর", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "Video Editor", section: "Learner Focus" },
  { name: "ভার্চুয়াল অ্যাসিস্ট্যান্ট", category: "ফ্রিল্যান্সার (Freelancers)", translatedName: "Virtual Assistant", section: "Learner Focus" },

  { name: "ছোট ব্যবসায়ী", category: "ব্যবসায়ী (Business People)", translatedName: "Small Business Owner", section: "Learner Focus" },
  { name: "বড় ব্যবসায়ী", category: "ব্যবসায়ী (Business People)", translatedName: "Large Business Owner", section: "Learner Focus" },
  { name: "ই-কমার্স উদ্যোক্তা", category: "ব্যবসায়ী (Business People)", translatedName: "E-commerce Entrepreneur", section: "Learner Focus" },
  { name: "আমদানি-রপ্তানিকারক", category: "ব্যবসায়ী (Business People)", translatedName: "Importer & Exporter", section: "Learner Focus" },
  { name: "স্টার্টআপ ফাউন্ডার", category: "ব্যবসায়ী (Business People)", translatedName: "Startup Founder", section: "Learner Focus" },
  { name: "সেলস এক্সিকিউটিভ", category: "ব্যবসায়ী (Business People)", translatedName: "Sales Executive", section: "Learner Focus" },

  { name: "স্টুডেন্ট ভিসা আবেদনকারী", category: "বিদেশগামী মানুষ", translatedName: "Student Visa Applicant", section: "Learner Focus" },
  { name: "ওয়ার্ক পারমিট আবেদনকারী", category: "বিদেশগামী মানুষ", translatedName: "Work Permit Applicant", section: "Learner Focus" },
  { name: "ইমিগ্রেশন প্রার্থী", category: "বিদেশগামী মানুষ", translatedName: "Immigration Candidate", section: "Learner Focus" },
  { name: "ট্যুরিস্ট", category: "বিদেশগামী মানুষ", translatedName: "Tourist", section: "Learner Focus" },
  { name: "প্রবাসী কর্মী", category: "বিদেশগামী মানুষ", translatedName: "Expatriate Worker", section: "Learner Focus" },
  { name: "বিদেশে স্থায়ী হতে আগ্রহী ব্যক্তি", category: "বিদেশগামী মানুষ", translatedName: "Permanent Residency Seeker", section: "Learner Focus" },

  { name: "সন্তানকে পড়ানোর জন্য", category: "গৃহিণী (Housewives)", translatedName: "For Teaching Children", section: "Learner Focus" },
  { name: "আত্মবিশ্বাস বাড়ানোর জন্য", category: "গৃহিণী (Housewives)", translatedName: "Building Confidence", section: "Learner Focus" },
  { name: "অনলাইন কাজের জন্য", category: "গৃহিণী (Housewives)", translatedName: "For Online Work", section: "Learner Focus" },
  { name: "সামাজিক যোগাযোগের জন্য", category: "গৃহিণী (Housewives)", translatedName: "For Socializing", section: "Learner Focus" },

  { name: "পদোন্নতির জন্য", category: "চাকরিজীবী নারী ও পুরুষ", translatedName: "For Promotion", section: "Learner Focus" },
  { name: "আন্তর্জাতিক মিটিংয়ের জন্য", category: "চাকরিজীবী নারী ও পুরুষ", translatedName: "For International Meetings", section: "Learner Focus" },
  { name: "ইমেইল লেখার জন্য", category: "চাকরিজীবী নারী ও পুরুষ", translatedName: "For Writing Emails", section: "Learner Focus" },
  { name: "প্রেজেন্টেশন দেওয়ার জন্য", category: "চাকরিজীবী নারী ও পুরুষ", translatedName: "For Giving Presentations", section: "Learner Focus" },

  { name: "স্কুল শিক্ষক", category: "শিক্ষক ও প্রশিক্ষক", translatedName: "School Teacher", section: "Learner Focus" },
  { name: "কলেজ শিক্ষক", category: "শিক্ষক ও প্রশিক্ষক", translatedName: "College Teacher", section: "Learner Focus" },
  { name: "বিশ্ববিদ্যালয় শিক্ষক", category: "শিক্ষক ও প্রশিক্ষক", translatedName: "University Teacher", section: "Learner Focus" },
  { name: "কোচিং শিক্ষক", category: "শিক্ষক ও প্রশিক্ষক", translatedName: "Coaching Teacher", section: "Learner Focus" },
  { name: "অনলাইন টিউটর", category: "শিক্ষক ও প্রশিক্ষক", translatedName: "Online Tutor", section: "Learner Focus" },

  { name: "সফটওয়্যার ইঞ্জিনিয়ার", category: "প্রযুক্তি ও IT", translatedName: "Software Engineer", section: "Learner Focus" },
  { name: "ডেটা অ্যানালিস্ট", category: "প্রযুক্তি ও IT", translatedName: "Data Analyst", section: "Learner Focus" },
  { name: "AI ডেভেলপার", category: "প্রযুক্তি ও IT", translatedName: "AI Developer", section: "Learner Focus" },
  { name: "সাইবার সিকিউরিটি বিশেষজ্ঞ", category: "প্রযুক্তি ও IT", translatedName: "Cyber Security Expert", section: "Learner Focus" },
  { name: "ক্লাউড ইঞ্জিনিয়ার", category: "প্রযুক্তি ও IT", translatedName: "Cloud Engineer", section: "Learner Focus" },

  { name: "ডাক্তার", category: "স্বাস্থ্যসেবা (Healthcare)", translatedName: "Doctor", section: "Learner Focus" },
  { name: "নার্স", category: "স্বাস্থ্যসেবা (Healthcare)", translatedName: "Nurse", section: "Learner Focus" },
  { name: "ফার্মাসিস্ট", category: "স্বাস্থ্যসেবা (Healthcare)", translatedName: "Pharmacist", section: "Learner Focus" },
  { name: "মেডিকেল টেকনোলজিস্ট", category: "স্বাস্থ্যসেবা (Healthcare)", translatedName: "Medical Technologist", section: "Learner Focus" },
  { name: "মেডিকেল ছাত্র", category: "স্বাস্থ্যসেবা (Healthcare)", translatedName: "Medical Student", section: "Learner Focus" },

  { name: "ট্যুর গাইড", category: "পর্যটন ও হসপিটালিটি", translatedName: "Tour Guide", section: "Learner Focus" },
  { name: "হোটেল কর্মী", category: "পর্যটন ও হসপিটালিটি", translatedName: "Hotel Staff", section: "Learner Focus" },
  { name: "রিসেপশনিস্ট", category: "পর্যটন ও হসপিটালিটি", translatedName: "Receptionist", section: "Learner Focus" },
  { name: "বিমানবালা", category: "পর্যটন ও হসপিটালিটি", translatedName: "Flight Attendant", section: "Learner Focus" },
  { name: "ট্রাভেল এজেন্ট", category: "পর্যটন ও হসপিটালিটি", translatedName: "Travel Agent", section: "Learner Focus" },

  { name: "কল সেন্টার এজেন্ট", category: "কাস্টমার সার্ভিস", translatedName: "Call Center Agent", section: "Learner Focus" },
  { name: "কাস্টমার সাপোর্ট প্রতিনিধি", category: "কাস্টমার সার্ভিস", translatedName: "Customer Support Rep", section: "Learner Focus" },
  { name: "টেলিমার্কেটার", category: "কাস্টমার সার্ভিস", translatedName: "Telemarketer", section: "Learner Focus" },

  { name: "ইউটিউবার", category: "সোশ্যাল মিডিয়া", translatedName: "YouTuber", section: "Learner Focus" },
  { name: "ফেসবুক কনটেন্ট ক্রিয়েটর", category: "সোশ্যাল মিডিয়া", translatedName: "Facebook Content Creator", section: "Learner Focus" },
  { name: "ব্লগার", category: "সোশ্যাল মিডিয়া", translatedName: "Blogger", section: "Learner Focus" },
  { name: "ইনফ্লুয়েন্সার", category: "সোশ্যাল মিডিয়া", translatedName: "Influencer", section: "Learner Focus" },
  { name: "পডকাস্টার", category: "সোশ্যাল মিডিয়া", translatedName: "Podcaster", section: "Learner Focus" },

  { name: "আত্মবিশ্বাস বাড়াতে চান", category: "ব্যক্তিগত উন্নয়ন", translatedName: "Increase Confidence", section: "Learner Focus" },
  { name: "স্মার্টভাবে কথা বলতে চান", category: "ব্যক্তিগত উন্নয়ন", translatedName: "Speak Smartly", section: "Learner Focus" },
  { name: "নতুন বন্ধু বানাতে চান", category: "ব্যক্তিগত উন্নয়ন", translatedName: "Make New Friends", section: "Learner Focus" },
  { name: "আন্তর্জাতিক যোগাযোগ করতে চান", category: "ব্যক্তিগত উন্নয়ন", translatedName: "International Comm.", section: "Learner Focus" },

  { name: "IELTS", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "IELTS", section: "Learner Focus" },
  { name: "TOEFL", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "TOEFL", section: "Learner Focus" },
  { name: "PTE", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "PTE", section: "Learner Focus" },
  { name: "SAT", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "SAT", section: "Learner Focus" },
  { name: "GRE", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "GRE", section: "Learner Focus" },
  { name: "GMAT", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "GMAT", section: "Learner Focus" },
  { name: "Duolingo English Test", category: "পরীক্ষার্থীরা (Examinees)", translatedName: "Duolingo English Test", section: "Learner Focus" },

  { name: "গবেষক", category: "শিক্ষা ও গবেষণায়", translatedName: "Researcher", section: "Learner Focus" },
  { name: "লেখক", category: "শিক্ষা ও গবেষণায়", translatedName: "Writer", section: "Learner Focus" },
  { name: "অনুবাদক", category: "শিক্ষা ও গবেষণায়", translatedName: "Translator", section: "Learner Focus" },
  { name: "ধর্মীয় বক্তা", category: "শিক্ষা ও গবেষণায়", translatedName: "Religious Speaker", section: "Learner Focus" },

  { name: "নতুন দক্ষতা অর্জনের জন্য", category: "অবসরপ্রাপ্ত ব্যক্তি", translatedName: "Learn New Skills", section: "Learner Focus" },
  { name: "বিদেশে থাকা আত্মীয়দের সঙ্গে যোগাযোগের জন্য", category: "অবসরপ্রাপ্ত ব্যক্তি", translatedName: "Talk to Relatives Abroad", section: "Learner Focus" },
  { name: "বই পড়ার জন্য", category: "অবসরপ্রাপ্ত ব্যক্তি", translatedName: "Read Books", section: "Learner Focus" },

  { name: "৫–১০ বছর বয়সী শিশু", category: "শিশু ও কিশোর-কিশোরী", translatedName: "Children (5-10 yrs)", section: "Learner Focus" },
  { name: "১১–১৫ বছর বয়সী কিশোর", category: "শিশু ও কিশোর-কিশোরী", translatedName: "Teens (11-15 yrs)", section: "Learner Focus" },
  { name: "১৬–১৯ বছর বয়সী শিক্ষার্থী", category: "শিশু ও কিশোর-কিশোরী", translatedName: "Students (16-19 yrs)", section: "Learner Focus" },

  { name: "Spoken English", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Spoken English", section: "Learner Focus" },
  { name: "Communication Skills", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Communication Skills", section: "Learner Focus" },
  { name: "Grammar Learning", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Grammar Learning", section: "Learner Focus" },
  { name: "Vocabulary Building", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Vocabulary Building", section: "Learner Focus" },
  { name: "Public Speaking", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Public Speaking", section: "Learner Focus" },
  { name: "Business English", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Business English", section: "Learner Focus" },
  { name: "Academic English", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Academic English", section: "Learner Focus" },
  { name: "Interview English", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Interview English", section: "Learner Focus" },
  { name: "Travel English", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Travel English", section: "Learner Focus" },
  { name: "Email Writing", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Email Writing", section: "Learner Focus" },
  { name: "Presentation Skills", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "Presentation Skills", section: "Learner Focus" },
  { name: "English for Freelancing", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "English for Freelancing", section: "Learner Focus" },
  { name: "English for Study Abroad", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "English for Study Abroad", section: "Learner Focus" },
  { name: "English for Career Growth", category: "ইংরেজি শেখার উদ্দেশ্য", translatedName: "English for Career Growth", section: "Learner Focus" }
];

export const getInitialPromptForTopic = (topic: string, section?: string): string => {
  if (section === 'Spoken Practice') {
    return `User is practicing Spoken English for: "${topic}". Focus heavily on teaching new words, expressions, and highly situational dialogue.
1. Start by enthusiastically welcoming them to this specific spoken lesson in Bengali.
2. Provide 4-5 key vocabulary words or phrases they absolutely need for "${topic}" (with their Bengali meanings).
3. Provide 2-3 practical sentence examples for this context.
4. Finally, ask them a simple question or give them a roleplay scenario to make them speak/write.
Keep responses concise, interactive, and beautifully formatted in Markdown using mostly Bengali for explanation.`;
  }
  
  return `We are now focusing on Grammar Topic: **${topic}**. 
To master this grammar topic:
1. Explain the core grammar rules clearly in Bengali.
2. Provide 10-12 active examples translating from English to Bengali, covering common structures.
3. Invite the user to try making a sentence or ask a question if they found anything tricky.
Keep the tone encouraging, patient, and formatted in Markdown.`;
};

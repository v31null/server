/**
 * ============================================================================
 *                             PROPERTIME LOGIC
 * ============================================================================
 *
 * This library implements a historically and astronomically flawless time
 * system based on the English calendar transitions and the exact sidereal day,
 * spanning back through Egyptian, Sumerian, and Deep Stonehenge chronologies.
 *
 * ----------------------------------------------------------------------------
 * 1. THE TIME SYSTEM (01-60 MIN/SEC, 00 HOURS)
 * ----------------------------------------------------------------------------
 * Minutes and seconds run from 01 to 60, NEVER 00.
 * Why? Because they derive from the Latin "pars minuta prima" (first small part)
 * and "pars minuta secunda" (second small part). Because they represent active,
 * physical "laps" or fractions of ongoing time, there is no "zero" lap.
 *
 * Hours, however, represent COMPLETED units of time. Therefore, the hour
 * starts at 00.
 *
 * Example Start of Day: 00:01:01 AM
 * Example Noon Alignment: 11:60:60 AM (Strictly representing Non-standard 11:59:59 AM,
 * leading into 00:01:01 PM)
 *
 * ----------------------------------------------------------------------------
 * 2. THE EXACT DAY (SIDEREAL TIME & NO DRIFT)
 * ----------------------------------------------------------------------------
 * A true standard day is exactly 86,400 seconds long. To maintain the classical
 * 11:57 quirk without suffering from solar drift, the 57th minute of the
 * final hour acts as a massive "leap minute" that absorbs all remaining seconds.
 * Instead of ending at 11:57:04 PM, the final minute runs until 240 seconds:
 *
 *       --> 11:57:240 PM
 *
 * Upon the very next second, it snaps directly to 00:01:01 AM of the next day.
 *
 * Leap seconds are natively inserted:
 * - Mathematical 11-day cycle leap seconds (ending at 11:57:241 PM).
 * - Official scientifically added leap seconds — extend it further.
 *
 * ----------------------------------------------------------------------------
 * 3. HISTORICAL CALENDAR ERAS
 * ----------------------------------------------------------------------------
 * The timeline tracking spans seamlessly across deep history:
 *
 * ERA 0: Deep Stonehenge (JDN < -93407114)
 *   - The astronomical Neolithic computer. Years do not exist here.
 *   - 1 Lap = 56 Julian Years (Exactly 20,454 Days, tracking lunar standstill).
 *   - 1 Hole = 1 Julian Year (~365.25 Days, tracking solar cycles).
 *   - ANCHORED TO TODAY'S SKY: the whole deep-time count is pinned to the present.
 *     Because the 56 Aubrey Holes were a lunar instrument, Hole 1 / Lap 1 / Day 1 is
 *     set to the most recent major lunar standstill: the moment the Moon's mean node
 *     crossed 0 degrees Aries, on 29 January 2025 (JDN 2460705). Every ancient hole,
 *     lap and day is extrapolated backwards from that fixed point, so the 18.6-year
 *     standstill phase matches the real sky exactly for the present. The zero point is
 *     the standstill, not a solstice, so each Hole's day count begins at the node
 *     crossing rather than at midsummer - the way the Neolithic builders used the ring.
 *     The Lap and Hole are mean Julian cycles (56 x 365.25 = 20,454 days): exact near
 *     the anchor, drifting slowly across deep time, since the tropical year is not
 *     365.25 days and three nodal cycles total 55.83 years, not 56. The reverse
 *     conversion takes its phase from the same anchor, so changing the Egyptian epoch
 *     (which shifts the era boundary) leaves the conversion exact.
 *
 * ERA 1: Sumerian King List (JDN -93407114 to 707685)
 *   - Maps 261,430 years of early Kings (ALULIM to LUGAL-KITUN).
 *   - 360-day years composed of twelve 30-day months.
 *   - SOURCING METHODOLOGY: We are trusting the scribe of the Weld-Blundell Prism 
 *     (WB-444, c. 1800 BCE) over other inscriptions for these exact numbers. 
 *     We do this because WB-444 provides the most complete, intact sequence compared
 *     to MS Su2.
 *     While the later Uruk I kings (the 7 rulers after Bilgameš) lack archaeological 
 *     evidence and possess mathematically suspicious, realistic reigns (unlike their 
 *     mythically inflated predecessors), they were engineered by ancient scribes as 
 *     chronographic "gap-fillers" to seamlessly bridge Uruk to Ur. By trusting WB-444 
 *     as written, we respect their original intent and maintain a continuous, unbroken 
 *     mathematical coordinate system, rather than attempting a modern archaeological 
 *     reconstruction that would leave a 140-year hole in the timeline.
 *   - NOTE: This implementation utilizes the Sumerian Administrative Calendar,
 *     which was strictly designed for kings and the clergy, not the agricultural 
 *     farmer's calendar. 
 *   - NOTE: This format is a extrapolation intended to closely approximate 
 *     historical reality. While the literal terminology may differ from their exact language, 
 *     a Sumerian cleric of that era would likely recognize and understand the core 
 *     structural properties of the years mapped here.
 *
 * ERA 2: Egyptian Sothic Calendar (JDN 707686 to 1460919)
 *   - 365 days exactly. 12 months, 3 seasons (AKHET, PERET, SHEMU).
 *   - Days grouped cleanly into 10-day Decans (DEC).
 *   - Ends with 5 wandering epagomenal days (A.V. - Annus Vagus).
 *
 * ERA 3: Ancient Roman / Republican (JDN 1460920 to 1704986 [Pre-45 A.C.])
 *   - Transitions at JDN 1460920 (713 A.C.).
 *   - The ancient 10-month calendar. January and February do not exist.
 *   - December absorbs remaining days (culminating in 46 A.C. with 445 days).
 *
 * ERA 4: 45 A.C. to 1154 (N.S. - The Julian Standard)
 *   - Julius Caesar introduces New Style (N.S.).
 *
 * ERA 5: 1155 to 1751 (O.S. - The English Lady Day Shift)
 *   - England shifts New Year to March 25th, reverting to Old Style (O.S.).
 *   - Year 1154 becomes 448 days long.
 *
 * ERA 6: 1752 to Present (N.S. - Return to Sanity)
 *   - Wipes 11 days: 1752 09/02 11:57:240 PM jumps to 1752 09/14 00:01:01 AM.
 *
 * ----------------------------------------------------------------------------
 * 4. OLD TURKIC 12-ANIMAL CALENDAR
 * ----------------------------------------------------------------------------
 * WARNING: The Old Turkic format is an alternate linguistic overlay, not an 
 * isolated era standard. This means it actively calculates continuously across 
 * the entire timeline. You can legitimately extract Old Turkic 
 * translations for ancient A.C. dates.
 * 
 * - Animal Years (12-year cycle): BIČIN (Monkey), TAKAGU (Rooster), WT (Dog), TONGUZ (Pig),
 *   SIČKAN (Rat), UD (Ox), BARS (Tiger), TABWȘKAN (Rabbit), LU (Dragon), YILAN (Snake),
 *   YUNT (Horse), KONY (Sheep).
 * - Months: ARAM (1st), IKINTI (2nd), UEČUENČ (3rd), etc.
 * - Units: YWL (Turkic Year), AY (Turkic Month), KUEN (Turkic Day).
 * - Output via .toAltFormats()[10] (Turkish Runic) and [11] (English Translation).
 *
 * ----------------------------------------------------------------------------
 * 5. ABBREVIATIONS & TERMINOLOGY
 * ----------------------------------------------------------------------------
 * A.C. = Ante Christum (Before Christ).
 * A.D. = Anno Domini (In the Year of Our Lord). There is NO Anno Domini support printed after
 *        the A.C. era ends. Positive years are simply raw numbers.
 * O.S. = Old System / Old Style.
 * N.S. = New System / New Style.
 * A.V. = Annus Vagus (Wandering Year - Egyptian Epagomenal Days).
 * DEC  = Decan (10 Days) in Egyptian era, Decade (10 Years) in Roman/Modern eras.
 * YWL / AY / KUEN = Turkic Year, Month, Day respectively.
 * LAP / HOL = Stonehenge astronomical units (20,454 days and 365 days).
 * Month 90 = Winter (Dies Hiberni) - uncounted gap days before 713 A.C.
 * Month 91 = Mercedonius (Intercalaris) - Roman priest leap-month.
 * Month 92 = Intercalaris Prior (Caesar's 46 A.C. extra month).
 * Month 93 = Intercalaris Posterior.
 * Z = Zulu time. 
 * J = Japan time.
 *
 * ----------------------------------------------------------------------------
 * 6. DON'Ts
 * ----------------------------------------------------------------------------
 * - DON'T ASSUME minutes and seconds start at 00. They are strictly 01 to 60.
 * - DON'T ASSUME midnight/noon is 12:xx AM/PM. It is strictly 00:xx AM/PM.
 * - DON'T ASSUME this is not a solar clock. It is. Noon is strictly when the sun is at its zenith.
 * - DON'T ASSUME a day is 86,400 seconds (24 hours). A day is exactly 86,164
 *   seconds, properly absorbed at the end of the day.
 * - DON'T ASSUME the calendar shift happened in 1582. We follow the
 *   English civil calendar (September 1752).
 * - DON'T ASSUME years are zero-padded to 4 digits. Years are dynamic length.
 * - DON'T ASSUME chronological linearity. Days disappear (1752), months
 *   overlap (1154/1155 Lady Day), and ancient months literally do not exist.
 * - DON'T ASSUME days never exceed 31. Ancient intercalary months stretch wildly.
 * - DON'T ASSUME days are strictly sequential. They skip abruptly.
 * - DON'T ASSUME the year started on January 1st always.
 * - DON'T ASSUME Month 01 is always January. Before 45 A.C., it's Martius.
 * - DON'T ASSUME time is 9 hours ahead of UTC. System is the UTC. Greenwich Mean Time is
 *   9 hours behind UTC. Center of Time-keeping is Akashi Municipal Planetarium.
 * - DON'T ASSUME there is a Year 0. 1 A.C. jumps to Year 1.
 * - DON'T ASSUME leap seconds only happen when modern scientists say so.
 * - DON'T ASSUME the parser reads left-to-right. It reads right-to-left.
 * - DON'T ASSUME an input of 00:01:00 AM is valid. 00 seconds rolls back time.
 * - DON'T CONFUSE A.C. with A.D. A.C. is Ante Christum.
 * - DON'T ASSUME the system is purely based on one calendar. It's a continuous proleptic bridge.
 * - DON'T ASSUME AM/PM stands for Before/After Midnight. Ante/Post Meridiem (Midday).
 * - DON'T ATTEMPT to parse the 1154 transition without O.S./N.S. suffixes.
 * - DON'T ASSUME Ianuarius and Februarius exist all the time. Before 713 A.C.
 *   the winter was a nameless void dumped into Month 90.
 * - DON'T ASSUME you must use separate formats for deep time. The .toAltFormats()
 *   handles Stonehenge, Sumerian, Egyptian, Turkic, and Modern extraction.
 * - DON'T TRY to get Pre‑era by A.C. tag, Înainte Pozitiv tag serves it for a while
 *   before switching.
 *
 * ----------------------------------------------------------------------------
 * 7. USAGE MANUAL
 * ----------------------------------------------------------------------------
 *
 * [A] INITIALIZATION
 *   let now = propertime();                           — Grabs current local time (JST baseline)
 *   let past = propertime("19390101000101AM");        — Specific exact time
 *   let ancient = propertime("450101000101AM A.C.");  — A.C. time
 *
 *   Offsets and Daylight Saving Time (DST):
 *   let shifted = propertime(null, "M3", true);       — Grabs time with UTC+6 (JST-3) + DST
 *   - param2 (off_set_japan): String. "M" = minus. "3" = 3 hours. Fractionals allowed
 * 	 (e.g., "3F1TO2" for +3.5 hrs, "M1F1TO4" for -1.25 hrs).
 *   - param3 (is_day_time_saving): Boolean. If true, adds exactly 1 hour (3600s) to the resulting time.
 *
 *   String Format required for parsing:
 *   [Year][Month][Day][Hour][Min][Sec][AM/PM][Optional Suffixes]
 *   - Month, Day, Hour, Min MUST be parsed as exactly 2 digits each.
 *   - Sec is normally 2 digits, but CAN be 3 digits during the 11:57 PM daily leap minute (e.g., 240).
 *   - Year is variable length, read from right-to-left.
 *   - Suffixes supported: "A.C.", "O.S.", "N.S."
 *   - A.C. gets precedence over O.S./N.S. if both are present.
 *
 * [B] TIME TRAVEL (ADDING/SUBTRACTING)
 *   Use the .add() method. Negative numbers go backward in time.
 *   
 *   let nextDay = past.add(1, "DAYS");
 *   let lastSec = past.add(-1, "SEC");
 *
 * [C] OUTPUTTING DATA & THE `is_he` FLAG
 *   All output methods accept an optional `is_he` boolean flag (Holocene Era / 12k calendar).
 *   If `is_he = true`, it adds exactly 10,000 years to the astronomical year.
 *   It retains all canonical suffixes (like A.C., O.S., N.S.). If the date precedes 1 H.E.
 * 	 (10,000 B.C.), it falls back to the canonical Sumerian or Stonehenge format.
 *   
 *   Let's assume 'past' is 2000 B.C. (A.C.):
 *   past.toString(is_he);
 *   // false: "2000 01⁄01 00:01:01 AM A.C."
 *   // true:  "8 001 01⁄01 00:01:01 AM A.C."
 *
 *   past.getMeta(is_he);
 *   // false: { displayYear: "2000", suffix: " A.C." }
 *   // true:  { displayYear: "8 001", suffix: " A.C." }
 *
 *   past.toAltFormats(is_he);
 *   // Returns an array of exactly 20 formatted strings.
 *   // You extract them like: let turkic = past.toAltFormats()[10];
 *   // Assuming 'past' is 1939 Jan 1st 00:01:01 AM:
 *   [0] "1939/01/01"                        				(YYYY/MIN/DD)
 *   [1] "1939 01/01"                        				(YYYY MIN/DD)
 *   [2] "19390101"                          				(YYYYMMDD)
 *   [3] "193911"                            				(YYYY[m][dy] - no pad)
 *   [4] "1939011"                           				(YYYY[MIN][dy] - padded month)
 *   [5] "1939101"                           				(YYYY[m][DD] - padded day)
 *   [6] "1939 january 01"                   				(Full Month padded day)
 *   [7] "1939 january 1"                    				(Full Month no pad day)
 *   [8] "1939 jan. 1"                       				(Short Month no pad day)
 *   [9] "1939 jan. 01"                      				(Short Month padded day)
 *   [10] "4UENČ TABWȘKAN YWL , ARAM AY , 1INČ KUEN"		(Turkic Runic — for all eras)
 *   [11] "4ᵗʰ RABBIT YRS , 1ˢᵗ MON , 1ˢᵗ DAY"      		(Turkic English — for all eras)
 *   [12] "1939 YRS’s AKHET’s 1ˢᵗ MON’s 1ˢᵗ DEC’s 1 DAYS..."	(Egyptian Formal)
 *   [13] "1939 1⁄1-1⁄1"                            		(Egyptian Short)
 *   [14] "—"                                       		(Sumerian Formal - if applicable)
 *   [15] "—"                                       		(Sumerian Short - if applicable)
 *   [16] "—"                                       		(Stonehenge Formal - if applicable)
 *   [17] "—"                                       		(Stonehenge Short - if applicable)
 *   [18] "—"                                       		(Kings Regnal Formal - if applicable)
 *   [19] "—"                                       		(Kings Regnal Short - if applicable)
 *
 * [D] FORMAT
 * Format is ab ovo designt to flow as big→small. Different formats ,
 * e.g./ dd.MIN.yyyy or MIN/dd/yyyy can be achieved by array indexing.
 *
 * [E] MUSTN'Ts & STRICT LIMITATIONS
 *   1. [MUSTN'T EXPECT AUTO-DST]: Daylight saving is a political delusion.
 * 	 If you want to participate in the delusion, you must manually signal the system by passing true.
 * 	 Otherwise, we remain in JST purity, Japan Standard Time is the universal baseline of this
 * 	 system and DOES NOT see DST. The engine will NEVER automatically shift the clock for daylight
 * 	 saving. You MUST explicitly pass `true` to the `is_day_time_saving` parameter, or manually
 * 	 script the addition/removal of hours using `off_set_japan`. 
 *   2. [MUSTN'T USE '00' FOR MINUTES/SECONDS]: Unlike standard computer clocks (`00` to `59`),
 * 	 our minutes and seconds strictly range from `01` to `60`. Do not attempt to parse or inject
 * 	 a `00` minute/second into the string.
 *   3. [MUSTN'T ASSUME 60-SECOND MINUTES]: While most minutes are 60 seconds, the daily
 * 	 leap-minute at `11:57 PM` expands to up to 240/241 seconds to absorb the sidereal shift.
 * 	 Do not assume 60 seconds is a hard ceiling.
 *   4. [MUSTN'T LOOK FOR YEAR 0]: There is no Year 0. The calendar steps directly
 * 	 from `1 A.C.` to `1 A.D.`. Mathematical additions across the BCE/CE boundary naturally skip zero.
 *   5. [MUSTN'T FEED 24-HOUR STRINGS]: The parser mandates a 12-hour format string and always
 * 	 requires an explicit `AM` or `PM` attached to the very end of the string.
 * 	 We only speak in AM/PM, but you must do it my way.
 *   6. [MUSTN'T USE '12' FOR NOON/MIDNIGHT]: The hours of `12 AM` and `12 PM` do not logically exist.
 * 	 Hours represent completed units of time, meaning the first hour of a cycle strictly starts at `00`.
 * 	 Standard `12:00:00` noon is  mapped and aligned via `11:60:60`.
 *   7. [MUSTN'T EXPECT LEFT-TO-RIGHT PARSING]: Because the year length is  unbounded and dynamic
 * 	 (stretching back to deep Stonehenge epochs), the timestamp string is parsed strictly right-to-left.
 * 	 You must not assume fixed-length, zero-padded years like `YYYY`.
 *   8. [MUSTN'T ASSUME UTC IS THE CENTER OF TIME]: The system defines JST (Akashi Municipal Planetarium)
 * 	 as the universal chronological baseline. We do not add 9 hours to UTC, rather; Greenwich Mean Time is
 * 	 considered 9 hours behind the true baseline.
 *   9. [MUSTN'T ASSUME JANUARY IS MONTH 01]: Chronological history is not static. Before `45 A.C.`, Month 01
 * 	 is strictly *Martius* (March). Before `713 A.C.`, January and February do not  exist, and
 * 	 winter is a nameless void dumped entirely into Month 90.
 *   10. [MUSTN'T EXPECT THE 1582 GREGORIAN SHIFT]: We follow the English Lady Day shift and the subsequent
 * 	 civil standard. The timeline wipes 11 days abruptly in September 1752. Do not attempt to map
 * 	 the Catholic 1582 calendar corrections to this system.
 *   11. [MUSTN'T USE 'A.D.' SUFFIXES]: The timeline only acknowledges `A.C.` (Ante Christum) for negative years.
 * 	 There is absolutely no `A.D.` allowed or printed for positive years; they are handled purely as raw positive integers.
 *   12. [MUSTN'T PANIC AT 400-DAY YEARS OR 60-DAY MONTHS]: Calendar linearity is a myth. Year 1154  is
 * 	 448 days long. Ancient intercalary months (Months 90, 91, 92, 93) stretch wildly.
 * 	 Do not hardcode a cap of 31 days for a month or 366 days for a year if You want to support Pre-1900s, else; do not care.
 *   13. [MUSTN'T OMIT SUFFIXES ON AMBIGUOUS YEARS]: When interacting with transition periods (like the Lady Day overlap in 1154/1155),
 * 	 you must not leave the parser guessing. `O.S.` (Old Style) and `N.S.` (New Style)
 * 	 suffixes are  mandatory to resolve chronological overlaps.
 * 	 14. [MUSN'T THINK NEW IS NEW] N.S. or O.S. is depending on what Julius Ceasar's reform did
 *	 and-not what people did, N.S. of J.C. was in use until 1154 of Lady-day, then It switched to O.S..
 *   15. [MUSTN'T ASSUME SP IS THE NORMAL]: The standard space (SP) and standard hyphen-minus are not
 * 	 the baseline. The system expects the Non-Breaking Space (NBSP, \u00A0) and the
 * 	 Non-Breaking Hyphen (\u2011) as the universal default for all chronological formatting. You must
 * 	 treat standard breaking characters as fallback approximations.
 *   16. [MUSTN'T THINK A.C. IS FOR 1]: It Literally means Ante-christum, not "Before Year 1".
 * 	 Non-negative A.C.s do, & will, exist.
 * [F] SOURCES
 * The following sources and references were consulted:
 *
 * - en.wikipedia.org
 *     > List of English monarchs - Wikipedia
 *     > Wessex - Wikipedia
 *     > Edward the Elder - Wikipedia
 *     > Alfred the Great - Wikipedia
 *     > List of monarchs of Wessex - Wikipedia
 *     > Cerdic of Wessex - Wikipedia
 *     > Æthelberht, King of Wessex - Wikipedia
 *     > Æthelwulf, King of Wessex - Wikipedia
 *     > Kingdom of Sussex - Wikipedia
 *     > Kingdom of Essex - Wikipedia
 *     > Cenwalh of Wessex - Wikipedia
 *     > Uruk - Wikipedia
 *     > Udul-kalama - Wikipedia
 *     > Sumerian King List - Wikipedia
 *     > First Dynasty of Ur - Wikipedia
 *     > Lugal-kitun - Wikipedia
 *     > Gilgamesh - Wikipedia
 *     > Mesannepada - Wikipedia
 *     > Ur-Nungal - Wikipedia
 *     > Mesh-he - Wikipedia
 *     > Babylonian Chronicles - Wikipedia
 *     > Nabta Playa - Wikipedia
 *     > Newgrange - Wikipedia
 *     > Aubrey holes - Wikipedia
 *     > Edward Lhuyd - Wikipedia
 *     > Uruk period - Wikipedia
 *     > Proto-cuneiform - Wikipedia
 *     > 710s BC - Wikipedia
 *     > Esarhaddon - Wikipedia
 *     > Julian calendar - Wikipedia
 *     > 1928 United States presidential election - Wikipedia
 *     > 1928 United States elections - Wikipedia
 *     > List of calendars - Wikipedia
 *     > Egyptian calendar - Wikipedia
 *     > Thoth - Wikipedia
 *     > Sothic cycle - Wikipedia
 *     > Decree of Canopus - Wikipedia
 *     > Ebers Papyrus - Wikipedia
 *     > Talk:Egyptian calendar - Wikipedia
 *     > Roman calendar - Wikipedia
 *     > Karl Richard Lepsius - Wikipedia
 *     > Byzantine calendar - Wikipedia
 *     > February - Wikipedia
 * - researchgate.net
 *     > (PDF) VedicDateTime: An R package - ResearchGate
 *     > (PDF) Time Is Running. Ancient Greek Chronography and the Ancient Near East
 *     > (PDF) Contributions to Computational Assyriology - ResearchGate
 *     > Fred Wendorf 1924-2015. Biographical Memoirs by Joyce Marcus and Kent V. Flannery. pp. 1-17 National Academy of Sciences, Washington DC. - ResearchGate
 *     > A Computer-Aided Interpretation of the Nabta Playa Stone Circle - ResearchGate
 *     > (PDF) The people of Stonehenge - ResearchGate
 *     > Parchmarks at Stonehenge, July 2013 - ResearchGate
 *     > 2 W 20274: Uruk (modern, "Warka") Mesopotamian protocuneiform clay... | Download Scientific Diagram - ResearchGate
 *     > (PDF) 1. Possible Markers of Inauthenticity in a Greek New Testament Papyrus: Genuinely Bad or a Very Good Fake? - ResearchGate
 *     > Towards an absolute scientific date for the Egyptian New Kingdom, part 1: the Egyptian Civil Calendar revisited - ResearchGate
 *     > (PDF) MAY A 'SOTHIC FAULT LINE' EXIST IN THE CIVIL CALENDAR OF EGYPT?
 *     > A Sothic date for the early 4th Dynasty of Egypt - ResearchGate
 *     > The Calendars and the Year-counts of Ancient Egypt - ResearchGate
 *     > (PDF) 1April2021EgyptianChronologyZoltanSimon - ResearchGate
 *     > (PDF) Dating the reigns of Xerxes and Artaxerxes - ResearchGate
 *     > (PDF) The First Calends of the Julian Calendar - ResearchGate
 * - archive.org
 *     > Full text of "Hand Book Of British Chronology" - Internet Archive
 *     > A history of William Paterson and the Darien company
 *     > Full text of "The Illustrated Guide To The Egyptian Museum By Samy Salah"
 *     > Full text of "THE RECONSTRUCTED CHRONOLOGY OF THE EGYPTIAN KINGS THE EBERS CALENDAR IS PROBABLY THE MOST VALUABLE" - Internet Archive
 *     > Full text of "PC World" - Internet Archive
 *     > The decree of Canopus in hieroglyphics and Greek
 *     > Full text of "History of Duchess [sic] county, New York, with ... biographical sketches of some of its prominent men and pioneers" - Internet Archive
 *     > Full text of "Cyclopaedia of Biblical, theological, and ecclesiastical literature"
 *     > Full text of "The transactions of the Rockefeller family association for ... 1905-"
 * - britannica.com
 *     > List of British Monarchs | Kings and Queens of Britain - Britannica
 *     > Edward | Biography, Reign, & Facts - Britannica
 *     > Alfred | Biography, Reign, & Facts | Britannica
 *     > Cenwalh | Anglo-Saxon, Mercian, Christianity - Britannica
 *     > Stonehenge | History, Location, Map, Meaning, & Facts - Britannica
 *     > Stonehenge - 1st-2nd Stages, Aubrey Holes, Sarsen Stones, Trilithons, Station Stones | Britannica
 *     > Egyptian calendar | System, Ancient, & Facts - Britannica
 *     > Richard Lepsius | Decipherment, Coptic Studies, Prussian Expedition | Britannica
 *     > Edwin Smith papyrus | Medical Text, Surgery, Significance, & Location | Britannica
 * - isac.uchicago.edu
 *     > STUDIES IN ANCIENT ORIENTAL CIVILIZATION
 *     > Sumerian King List - Institute for the Study of Ancient Cultures
 *     > THE SUMERIANS - Institute for the Study of Ancient Cultures
 *     > Pomp, Circumstance, and the Performance of Politics - Institute for the Study of Ancient Cultures
 *     > STUDIES IN ANCIENT.ORIENTAL CIVILIZATION" NO. 26
 *     > ancient egyptian coregencies
 *     > THE UNIVERSITY OF CHICAGO ORIENTAL INSTITUTE PUBLICATIONS
 *     > SAOC 26. The Calendars of Ancient Egypt. Richard A. Parker
 *     > IN REMEMBRANCE OF ME - Institute for the Study of Ancient Cultures
 * - scribd.com
 *     > Wessex Kings Family Tree (802–1066) | PDF - Scribd
 *     > List of Wessex and Other English Kings | PDF | Sports & Recreation | Social Science - Scribd
 *     > Megaliths and Ceremonialism at Nabta Playa | PDF | Desert | Sahara - Scribd
 *     > Full Text PDF | PDF | Archaeology | Ur - Scribd
 *     > Late Uruk Pigs and Herded Animals | PDF - Scribd
 *     > A Study in The Coptic Calendar - The Week | PDF | Planets In Astrology | Jupiter - Scribd
 *     > Ancient Egyptian Calendar Origins | PDF - Scribd
 *     > Origins and Meanings of Month Names | PDF | Augustus | Ancient Roman Religion - Scribd
 *     > Cosmic Mysteries and Astrological Insights | PDF | Zodiac | Esoteric Cosmology - Scribd
 * - worldhistory.org
 *     > Timeline: Edward the Elder - World History Encyclopedia
 *     > Timeline: Alfred the Great - World History Encyclopedia
 *     > Timeline: Kingdom of Wessex - World History Encyclopedia
 *     > Sumerians: Inventors of Civilization - World History Encyclopedia
 *     > Sumerian King List - World History Encyclopedia
 *     > Gilgamesh - World History Encyclopedia
 *     > Geme-Suen v Ur-Lugal's Wife - A Court Case in Ancient Mesopotamia
 * - instonebrewer.com
 *     > Egyptian Royal Genealogy: Ptolemaic Chronology -- Roman 041 BC
 *     > Egyptian to Julian conversion: Canopic reform analysis
 *     > Egyptian to Julian conversion: Civil calendar structure
 *     > Ptolemaic Roman Calendar Conversion Tables
 *     > Ptolemaic Chronology -- Egyptian calendars
 * - brill.com
 *     > Sons of the Sun: The Mythological Foundations of the First Dynasty of Uruk* in - Brill
 *     > ADMINISTRATIVE TIMEKEEPING IN ANCIENT MESOPOTAMIA* BY R. K. ENGLUND One of the ostensibly unassuming but, for want of better exa - Brill
 *     > Administrative Timekeeping in Ancient Mesopotamia in - Brill
 *     > Anglo-Saxon Prognostics, 900-1100 - Brill
 * - cdli.ox.ac.uk
 *     > Uruk (modern Warka) - CDLI Wiki
 *     > Proto-cuneiform - CDLI Wiki
 *     > The Late Uruk Period - CDLI Wiki
 *     > State of Research - CDLI Wiki
 * - journals.uchicago.edu
 *     > Valuable than All Gold": Ptolemy's Royal Canon and Babylonian Chronology - The University of Chicago Press: Journals
 *     > Sargon II's Defeat of Egypt: Rhetoric or Historical Facts?
 *     > A Survey of Dated Babylonian Economic Texts, 721-626 - The University of Chicago Press: Journals
 *     > The Fifth-Century Jewish Calendar at Elephantine
 * - academia.edu
 *     > (PDF) Evidence of Periodicity in Ancient Egyptian Calendars of Lucky and Unlucky Days
 *     > Chronological Framework of Ancient History. 2: Founding of the Nations - Academia.edu
 *     > (PDF) Universal Chronology of Egypt - Ch.3 of Seeds of Western Culture - Academia.edu
 * - academic.oup.com
 *     > Results from the investigation of temporal discontinuity in the Hydrogen Epoch of Reionization Array data - Oxford Academic
 *     > Temporal discontinuity analysis - ORIGINAL UNEDITED MANUSCRIPT - Oxford University Press
 *     > Results from the investigation of temporal discontinuity in the Hydrogen Epoch of Reionization Array data | RAS Techniques and Instruments | Oxford Academic
 * - archiv.ub.uni-heidelberg.de
 *     > GERMAN BIBLICAL ARCHAEOLOGY: RETROSPECTIVE OF A NEGLECTED LEGACY A Study of the German contribution to the A
 *     > Egypt as an astronomical-astrological Mesopotamia, Greece, and India
 *     > Early encounters: Egyptian-Coptic studies and comparative linguistics in the century from Schlegel to Finck*
 * - cambridge.org
 *     > Writing and the Perpetuation of the State (Part III) - Writing and the Ancient State
 *     > The Reduplicated Present (Chapter 4) - Origins of the Greek Verb
 *     > Evidence of Periodicity in Ancient Egyptian Calendars of Lucky and Unlucky Days | Cambridge Archaeological Journal
 * - dokumen.pub
 *     > Ancient Africa: A Global History, to 300 CE 069124409X, 9780691244099 - dokumen.pub
 *     > Breaking Ground: Pioneering Women Archaeologists - DOKUMEN.PUB
 *     > The Ancient Egyptian Daybook 9781365587870, 9781365587948, 9781365620836 - DOKUMEN.PUB
 * - kids.kiddle.co
 *     > List of monarchs of Wessex Facts for Kids
 *     > Sothic cycle Facts for Kids
 *     > February Facts for Kids
 * - metmuseum.org
 *     > Gilgamesh - The Metropolitan Museum of Art
 *     > The Origins of Writing - The Metropolitan Museum of Art
 *     > Telling Time in Ancient Egypt - The Metropolitan Museum of Art
 * - books.ub.uni-heidelberg.de
 *     > In Search of the Origins of Lower Egyptian Pottery: A New Approach to Old Data (Studies in African Archaeology, Vol. 16) - Publishing Services Heidelberg University Library
 *     > Romuald Schild - FRED WENDORF, Jr. 31 July 1924 – 15 July 2015 The Founder of the Combined Prehistoric Expedition and for Several Decades its Guiding Spirit1 - Publishing Services Heidelberg University Library
 * - britishmuseum.org
 *     > mace | British Museum
 *     > tablet; seal-impression | British Museum
 * - de.wikipedia.org
 *     > Julius Jordan (Archäologe) - Wikipedia
 *     > Kanopus-Dekret - Wikipedia
 * - ebsco.com
 *     > Building of Stonehenge | Anthropology | Research Starters - EBSCO
 *     > Egyptian calendar | History | Research Starters - EBSCO
 * - english-heritage.org.uk
 *     > Stonehenge archaeologists | English Heritage
 *     > Sources for Stonehenge | English Heritage
 * - i-asc.org
 *     > The History and Science of Leap Day - A pair of two lessons about February 29 Pt.2 | I-ASC
 *     > The History and Science of Leap Day – A pair of two lessons about February 29 Pt.2 - I-ASC
 * - iris.polito.it
 *     > The first Calends of the Julian Calendar - POLITECNICO DI TORINO Repository ISTITUZIONALE
 *     > POLITECNICO DI TORINO Repository ISTITUZIONALE
 * - livius.org
 *     > CM 7 (Tummal Chronicle) - Livius
 *     > The Sumerian King List - Livius.org
 * - oracc.museum.upenn.edu
 *     > BC 115 Shiff - Oracc - University of Pennsylvania
 *     > dcclt - Oracc
 * - penn.museum
 *     > Leon Legrain - Penn Museum
 *     > Museum Bulletin | The Uruk Period
 * - pmc.ncbi.nlm.nih.gov
 *     > Stonehenge: a view from medicine - PMC - NIH
 *     > Lost in translation: the history of the Ebers Papyrus and Dr. Carl H. von Klein - PMC
 * - timeanddate.com
 *     > October 899 Calendar – Julian calendar - Time and Date
 *     > Year 713 Calendar – Egypt - Time and Date
 * - yorku.ca
 *     > Egyptian Civil to Julian Calendar Conversion Tables
 *     > Ptolemaic Roman Calendar Conversion Tables
 * - aa.usno.navy.mil
 *     > Julian Date Converter - US Naval Observatory Astronomical Applications Department
 * - acsearch.info
 *     > Results 1-100 of 100 (0.00 seconds) - acsearch.info - Auction research
 * - adip.faa.gov
 *     > Airport Data and Information Portal
 * - alexanderancientart.com
 *     > Sopdet - Alexander Ancient Art
 * - almanac.com
 *     > February Calendar 2026: Holidays, Fun Facts, and Folklore - Farmer's Almanac
 * - amrcoins.com
 *     > Anglo-Saxon Coins a background Pt1
 * - ancientmesopotamia.org
 *     > People | Mesannepada - Ancient Mesopotamia
 * - ancientworldmagazine.com
 *     > Evolution of Sumerian kingship - Ancient World Magazine
 * - ancientworldonline.blogspot.com
 *     > Online Prepublication: Mesopotamian Chronicles
 * - anglo-ethiopian.org
 *     > Seven Years Younger - Anglo-Ethiopian Society
 * - ankhonline.com
 *     > Nabta Playa During the Early and Middle Holocene - Ankhonline
 * - api.pageplace.de
 *     > Kings and Kingdoms of Early Anglo-Saxon England
 * - apps.aavso.org
 *     > Julian Date Converter - aavso
 * - archaeology.sa
 *     > Jean-François Champollion – Archaeology Magazine
 * - archive.griffith.ox.ac.uk
 *     > Lepsius, Karl Richard - Griffith Institute Archive
 * - arkeonews.net
 *     > Archaeologists Discover Unique Hieroglyphic Version of Ptolemy III's Canopus Decree - Arkeonews
 * - armaghrobinsonlibrary.co.uk
 *     > Exhibition History of Calendars - Armagh Robinson Library & No 5
 * - asmalldoseoftoxicology.org
 *     > Papyrus - Toxipedia
 * - assets.cambridge.org
 *     > ILLUMINATING THE WORD IN THE EARLY MIDDLE AGES - Assets - Cambridge University Press
 * - assyriologie.uni-muenchen.de
 *     > Children in Institutional Households of Late Uruk Period Mesopotamia
 * - astronomy.com
 *     > Nabta Playa: The world's first astronomical site was built in Africa - Astronomy Magazine
 * - atarimagazines.com
 *     > Egypt Calendar - Classic Computer Magazine Archive
 * - ateneu.xtec.cat
 *     > Egyptian Calendar - Ateneu
 * - atlasobscura.com
 *     > Nabta Playa Stone Circle in Aswan - Atlas Obscura
 * - austriaca.at
 *     > 7. chronicles
 * - avalon.law.yale.edu
 *     > The Anglo-Saxon Chronicle : Ninth Century - Avalon Project
 * - bibalex.org
 *     > SCIplanet - Imhotep: World's First Astronomer - Bibliotheca Alexandrina
 * - bibelgriechisch.online
 *     > Authentic: The Case for Mark 16:9-20 James Snapp, Jr. - Bibelgriechisch.online
 * - bisi.ac.uk
 *     > In the 1920s Sir Leonard Woolley's excavations at Ur competed for the public's attention with - The British Institute for the Study of Iraq
 * - brewminate.com
 *     > Calends: The Adoption and Use of the Julian Solar Calendar in Ancient Rome - Brewminate
 * - britnumsoc.org
 *     > THE COINAGE OF .ETHELRED I (865-871) - British Numismatic Society
 * - britroyals.com
 *     > King Edward The Elder | Britroyals
 * - carltonroadacademy.net
 *     > Kingdoms, Battles and Life in the Anglo-Saxon Times Famous Anglo-Saxons Anglo-Saxon Timeline
 * - cartlann.org
 *     > Essays and Poems by Thomas Davis - Cartlann
 * - cdfa.ca.gov
 *     > JULIAN DATE CALENDAR JULIAN DATE CALENDAR
 * - cespu.pt
 *     > Relatório de Atividades do Instituto Universitário de Ciências da Saúde - CESPU
 * - chr.org.uk
 *     > Gregorian Calendar Archives - And Did Those Feet
 * - christies.com
 *     > AN IMPORTANT MESOPOTAMIAN PROTO-CUNEIFORM CLAY ADMINISTRATIVE TABLET , URUK III PERIOD, CIRCA 3000 B.C. | Christie's
 * - core2.gsfc.nasa.gov
 *     > Julian Day Number Calculations
 * - cran.r-project.org
 *     > VedicDateTime - CRAN
 * - csweb.bournemouth.ac.uk
 *     > Draft of Appendix I: Select Investigations of the Stonehenge Landscape - Bournemouth University
 * - d3ums4016ncdkp.cloudfront.net
 *     > the williams collection of anglo-saxon, viking and norman coins part i
 * - dib.ie
 *     > Newgrange and the ghosts of Killmackumpshaugh - Dictionary of Irish Biography
 * - discovermagazine.com
 *     > Nabta Playa: The World's First Astronomical Site Was Built in Africa and Is Older Than Stonehenge | Discover Magazine
 * - discoveryuk.com
 *     > The Anglo-Saxon Kings of Wessex Listed in Order - Discovery UK
 * - drikpanchang.com
 *     > September 21, 2022 Gujarati Daily Panchang for New Delhi, NCT, India
 * - dspace.ut.ee
 *     > PEETER ESPAK The God Enki in Sumerian Royal Ideology and Mythology - DSpace - Tartu Ülikool
 * - egyptologyforum.org
 *     > THE EEF GUIDE TO INTERNET RESOURCES FOR ANCIENT EGYPTIAN TEXTS
 * - elibrary.bsu.edu.az
 *     > Kings and Kingdoms of Early Anglo-Saxon England - elibrary.bsu.az
 * - elibrary.imf.org
 *     > International Financial Statistics, October 1950 - IMF eLibrary
 * - engelsbergideas.com
 *     > Uruk and the origins of the sacred economy - Engelsberg ideas
 * - epochconverter.com
 *     > Day numbers for 2022 - Epoch Converter
 * - epub.uni-regensburg.de
 *     > The 360-Day Year in Mesopotamia Lis Brack-Bernsen
 * - escholarship.org
 *     > The Wikipedic Novel: Reading & Writing in The Open-Source Era - UC Berkeley
 * - etcsl.orinst.ox.ac.uk
 *     > The Sumerian king list: translation
 * - eurekalert.org
 *     > Proto-cuneiform tablet of Uruk V period [IMAGE] | EurekAlert! Science News Releases
 * - fmg.ac
 *     > ENGLAND ANGLO-SAXON KINGS - Foundation for Medieval Genealogy
 * - fourmilab.ch
 *     > Calendar Converter - Fourmilab
 * - freight.cargo.site
 *     > CAPS-LOCK.pdf - freight.cargo.si
 * - friesian.com
 *     > The Middle Kingdom of Egypt, Early Babylonia and Assyria
 * - glyphdwellers.com
 *     > Report 70 - The Great Year of the Maya - Michael J. Grofe - May 2021 - Glyph Dwellers
 * - greyroom.org
 *     > Outdating: The Time of "Culture" in Colonial Egypt by On Barak - Grey Room
 * - guambuildupeis.us
 *     > CHAPTER 2. OVERVIEW OF BEST MANAGEMENT PRACTICES AND PROPOSED MITIGATION MEASURES
 * - gupea.ub.gu.se
 *     > Gaming in Mohenjo-daro – an Archaeology of Unities - Gupea
 * - gutenberg.org
 *     > The Literature of the Celts | Project Gutenberg
 * - helda.helsinki.fi
 *     > Contributions to Computational Assyriology - Helda - University of Helsinki
 * - historic-uk.com
 *     > Kings and Queens of Wessex - Historic UK
 * - historyforkids.net
 *     > Roman Calendar - History For Kids
 * - historyireland.com
 *     > CHARLES CAMPBELL—THE MAN WHO DISCOVERED NEWGRANGE - History Ireland
 * - hoover.archives.gov
 *     > CAMPAIGN AND TRANSITION COLLECTION: 1928 - 1929 - Herbert Hoover Presidential Library-Museum
 * - ia800507.us.archive.org
 *     > Our race : its origin and its destiny
 * - ia801504.us.archive.org
 *     > Witchcraft And Black Magic
 * - ia803106.us.archive.org
 *     > Encyclopedia of the Archaeology of Ancient Egypt
 * - iac.es
 *     > chapter 4 the egyptian calendar
 * - ideadeco.co
 *     > Welcome February Magic in Athens Greece | IDEADECO
 * - immortalwordsmith.co.uk
 *     > King Cerdic of Wessex – The First Saxon King? | IW History Blog - Immortal Wordsmith
 * - ingentaconnect.com
 *     > NABTA PLAYA IN THE DEVELOPMENT OF SCIENCE AND TECHNOLOGY - Ingenta Connect
 * - iris.unito.it
 *     > Wisdom Between East and West: Mesopotamia, Greece and Beyond
 * - irispublishers.com
 *     > A Computer-Aided Interpretation of the Nabta Playa Stone Circle - Iris Publishers
 * - is.muni.cz
 *     > The Archaic Texts from Uruk - IS MUNI
 * - isac-idb-static.uchicago.edu
 *     > The Oriental Institute - The University of Chicago
 * - isac-idb.uchicago.edu
 *     > ISAC Museum Record ID 066eb5a6-d8ef-42cf-a126-040a85768a6b
 * - journals.pan.pl
 *     > The Megaliths of Nabta Playa
 * - jstage.jst.go.jp
 *     > Ur III Economy and Bureaucracy - J-Stage
 * - kar.zcu.cz
 *     > Nabta Playa and Its Role in Northeastern African Prehistory - KAR ZCU
 * - keytoumbria.com
 *     > Roman Republic - Key to Rome
 * - knowledgebasedsociety.com
 *     > Administrative Timekeeping in Ancient Mesopotamia - Knowledge ...
 * - knowth.com
 *     > Professor Michael J. O'Kelly and the Excavation of Newgrange - Knowth
 * - labrujulaverde.com
 *     > Stele with a Complete Monolingual Version of the Canopus Decree Issued by Pharaoh Ptolemy III in 238 B.C. Discovered - La Brújula Verde
 * - lavia.org
 *     > Ancient Egyptian civil calendar
 * - liverpooluniversitypress.co.uk
 *     > EDWARD LHWYD (1659/60–1709): SALVAGING A LIFETIME OF PATIENT SCHOLARSHIP1 | The Bodleian Library Record
 * - longpelaexpertise.com.au
 *     > Julian Date Converter - Longpela Expertise
 * - lsa.umich.edu
 *     > Tales of collectors & collections from the Kelsey Museum - College of LSA - University of Michigan
 * - lughayangu.com
 *     > Rome Didn't Invent the 365-Day Year - Lugha Yangu
 * - magazine.unibo.it
 *     > The origin of writing in Mesopotamia is tied to designs engraved on ancient cylinder seals
 * - megalithic.co.uk
 *     > Nabta Playa, Nubia - The Megalithic Portal
 * - mikepitts.wordpress.com
 *     > Stonehenge: Not just a man thing - Mike Pitts Digging Deeper
 * - millercenter.org
 *     > Herbert Hoover: Campaigns and Elections | Miller Center
 * - mosaicprojects.com.au
 *     > The origins of the Coordinated Universal Time (UTC) calendar - Mosaic Projects
 * - msu-anthropology.github.io
 *     > Fred Wendorf
 * - museum.ie
 *     > The Winter solstice at Newgrange | National Museum of Ireland
 * - mythicalireland.com
 *     > 101 Facts about Newgrange - Mythical Ireland
 * - nationaldaycalendar.com
 *     > FEBRUARY 18 | Birthdays and Events - National Day Calendar
 * - networkcultures.org
 *     > marianne van den boomen transcoding the digital how metaphors matter in new media
 * - newtonproject.ox.ac.uk
 *     > Observations upon the Prophecies of Daniel and the Apocalypse of St. John (Normalized)
 * - ninercommons.charlotte.edu
 *     > COUNTING DAYS IN ANCIENT BABYLON: ECLIPSES, OMENS, AND CALENDRICS DURING THE OLD BABYLONIAN PERIOD (1750-1600 BCE) by Steven Jed
 * - online.ucpress.edu
 *     > Temples à Escaliers: The Dura Evidence | Classical Antiquity
 * - pdfs.semanticscholar.org
 *     > POLITECNICO DI TORINO Repository ISTITUZIONALE - Semantic Scholar
 * - penelope.uchicago.edu
 *     > Roman Calendar
 * - pmworldlibrary.net
 *     > The Origins of the Coordinated Universal Time (UTC) Calendar - PM World Library
 * - pol-study.com
 *     > Chapter 6 – Introduction to the Case Studies
 * - prehistoricsociety.org
 *     > INTRODUCTION TO PREHISTORY NEOLITHIC FACTSHEET 14 STONEHENGE - The Prehistoric Society
 * - proteo.hu
 *     > The Stele of YHWH in Egypt
 * - quasar.as.utexas.edu
 *     > Julian Day Number Calculator - Bill Jefferys
 * - rcin.org.pl
 *     > The megaliths of Nabta Playa - Digital Repository of Scientific Institutes
 * - repositorio.uca.edu.ar
 *     > Cuadernos del Centro de Estudios de Historia del Antiguo Oriente n° 16 2018 - Repositorio Institucional UCA
 * - research-management.mq.edu.au
 *     > “THE CABLE GUY”: CONSTANTINE SIMONIDES AND CODEX MAYERIANUS1 - Macquarie University
 * - resolve.cambridge.org
 *     > chapter vi - chronology - Cambridge University Press & Assessment
 * - roger-pearse.com
 *     > Machine-translated portions of the new Maronite Chronicle of 713 in English - Roger Pearse
 * - royal.uk
 *     > Alfred 'The Great' (r. 871-899) | The Royal Family
 * - scholar.google.com
 *     > ‪Robert K. Englund‬ - ‪Google Scholar‬
 * - semanticscholar.org
 *     > [PDF] Administrative Timekeeping in Ancient Mesopotamia | Semantic Scholar
 * - shs.cairn.info
 *     > 17 Ur III texts in a private collection in Paris | Cairn.info
 * - silburycoins.co.uk
 *     > Anglo-Saxon Kingdoms: Wessex - Silbury Coins
 * - simple.wikipedia.org
 *     > Cenwalh of Wessex - Simple English Wikipedia, the free encyclopedia
 * - smaam.church
 *     > What is the Coptic Calendar? - SMAAM Staging
 * - smu.edu
 *     > World renowned SMU archaeologist Fred Wendorf has died
 * - spectrum.library.concordia.ca
 *     > Investigating the Conceptualization of Divinity in the Eden Narrative (Gen 2 ̶ 3): An Exegetical Project Garner Remy A
 * - staff.science.uu.nl
 *     > Almagest Ephemeris Calculator - webspace.science.uu.nl
 * - t5k.org
 *     > Prime Curios! 1973
 * - tandfonline.com
 *     > Full article: Queries and quaestiones: Edward Lhwyd between Natural History and Natural Philosophy - Taylor & Francis
 * - thecollector.com
 *     > What Is the Origin of the Calendar? - TheCollector
 * - tjaglcs.army.mil
 *     > Fiscal Law Deskbook (2026) - The Judge Advocate General's Legal Center and School - U.S. Army
 * - transport.nsw.gov.au
 *     > 713 AC Feeder October Notification - Transport for NSW
 * - trismegistos.org
 *     > TM Time
 * - trove.nla.gov.au
 *     > 02 Aug 1930 - In the Land of Nimrod. - Trove
 * - uni-koeln.de
 *     > alexander jones calendrica ii: date equations from the reign of augustus
 * - unleashcb.com
 *     > 90-Pound Rucksack Challenge | Fundraiser for Crescent Hill Ski Patrol - February 18 - Honey Creek, Iowa - Unleash Council Bluffs
 * - unofficialroyalty.com
 *     > British Royals | Unofficial Royalty | Page 34
 * - uop.whoi.edu
 *     > Julian Day Table for Non-Leap Years
 * - upload.wikimedia.org
 *     > The world's progress : a dictionary of dates - Wikimedia Commons
 * - uplopen.com
 *     > 1. POSSIBLE MARKERS OF INAUTHENTICITY IN A GREEK NEW TESTAMENT PAPYRUS: GENUINELY BAD OR A VERY GOOD FAKE? - University Press Library Open
 * - upskillstutor.com
 *     > From Roman Calendars to Modern Times: Deciphering the Story Behind February's 28 Days
 * - uruk-warka.dk
 *     > nippur نيبور
 * - uu.diva-portal.org
 *     > The Urban Mind - https ://uu.diva-portal.org
 * - viewsproject.wordpress.com
 *     > Introducing our second new VIEWS researcher
 * - vikingeskibsmuseet.dk
 *     > The Anglo-Saxon Chronicle: The Viking Ship Museum - Vikingeskibsmuseet
 * - vintageapple.org
 *     > Byte May 1986 - Vintage Apple
 * - webexhibits.org
 *     > Early Roman Calendar - Webexhibits
 * - wncc.edu
 *     > Events - WNCC Calendar
 * - wuw.pl
 *     > Polish Archaeology in the Mediterranean 33
 * - www-angler.larc.nasa.gov
 *     > Julian Day Chart for Non-Leap Year
 * 
 * ============================================================================
 * NOTE: this is a standard, it can not be copyrighted in any way.
 * It is free for anyone to implement in any programming language,
 * and to use for any purpose, commercial or non-commercial.
 * This replaces ISO 8601 as a new time standard for my-self
 * and for anyone who wants to use it.
 * Trying to copyright this is stupid. Dont waste your time. Just use it.
 * ============================================================================
 */

const propertime = (function () {
	const UNITS = ["SEC", "MIN", "HRS", "DAYS", "WEEK", "MON", "YRS", "DEC", "CEN", "MIL", "YWL", "AY", "KUEN", "LAP", "HOL", "SEA"];
	const FS = "\u2044";
	const MONTHS_FULL = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
	const MONTHS_SHORT = ["jan.", "feb.", "mar.", "apr.", "may", "jun.", "jul.", "aug.", "sep.", "oct.", "nov.", "dec."];
	const EGYPTIAN_EPOCH_2782 = 705497;
	const EGYPTIAN_EPOCH_2776 = 707686;
	const EGYPTIAN_EPOCH_2773 = 708785;
	let currentEgyptianEpoch = EGYPTIAN_EPOCH_2776;

	const UNIVERSAL_ANCHOR = 2460705;

	const EGYPTIAN_SEASONS = ["AKHET", "AKHET", "AKHET", "AKHET", "PERET", "PERET", "PERET", "PERET", "SHEMU", "SHEMU", "SHEMU", "SHEMU"];

	const SUMERIAN_KINGS = [
		["ALULIM", 28800], ["ALALGAR", 36000], ["EN-MEN-LU-ANA", 43200], ["EN-MEN-GAL-ANA", 28800], ["DUMUZID-SIPAD", 36000], ["EN-SIPAD-ZID-ANA", 28800], ["EN-MEN-DUR-ANA", 21000], ["UBARA-TUTU", 18600],
		["ĜUȘUR", 1200], ["POLYARKIE", 960], ["NANĜIȘLIȘMA", 670], ["EN-TARAḪ-ANA", 420], ["BABUM", 300], ["PUANNUM", 840], ["KALIBUM", 900], ["KALUMUM", 840], ["ZUQAQIP", 900], ["ATAB", 600], ["MAȘDA", 840], ["ARWIUM", 720], ["ETANA", 1500], ["BALIḪ", 400], ["EN-ME-NUNA", 660], ["MELEM-KIȘ", 900], ["BARSAL-NUNA", 1200], ["ZAMUG", 140], ["TIZQAR", 305], ["ILKU", 900], ["ILTASADUM", 1200], ["EN-ME-BARAGE-SI", 900], ["AGA", 625],
		["MEȘ-KI-AĜ-GAȘER", 324], ["ENMERKAR", 420], ["LUGALBANDA", 1200], ["DUMUZID", 100], ["BILGAMEȘ", 126], ["UR-NUN-GAL", 30], ["UDUL-KALAMA", 15], ["LA-BA'ȘUM", 9], ["EN-NUN-TARAḪ-ANA", 8], ["MEȘ-ḪE", 36], ["MELEM-ANA", 6], ["LUGAL-KITUN", 36]
	];
	const SUMERIAN_TOTAL_YEARS = 261430;

    const EGYPTIAN_KINGS = [
        ["NARMER", 40],
        ["AHA", 30],
        ["DJER", 41],
        ["DJET", 10],
        ["DEN", 42],
        ["ANEDJIB", 10],
        ["SEMERKHET", 9],
        ["QA'A", 33],
        ["HOTEPSKHEMWY", 38],
        ["RENEB", 39],
        ["NYNETJER", 40],
        ["PERIBSEN", 17],
        ["KHASEKHEMWY", 18],
        ["DJOSER", 29],
        ["SEKHEMKHET", 6],
        ["KHABA", 6],
        ["HUNI", 24],
        ["SNEFERU", 24],
        ["KHUFU", 23],
        ["DJEDEFRE", 8],
        ["KHAFRE", 26],
        ["MENKAURE", 18],
        ["SHEPSESKAF", 4],
        ["USERKAF", 7],
        ["SAHURE", 13],
        ["NEFERIRKARE KAKAI", 20],
        ["NIUSERRE INI", 24],
        ["MENKAUHOR KAIU", 8],
        ["DJEDKARE ISESI", 39],
        ["UNAS", 30],
        ["TETI", 12],
        ["MERYRE PEPI", 49],
        ["MERENRE NEMTYEMSAF", 14],
        ["NEFERKARE PEPI", 94],
        ["MERIKARE", 10],
        ["TEPYA MENTUHOTEP", 15],
        ["SEHERTAWY INTEF", 16],
        ["WAHANKH INTEF", 49],
        ["NAKHTNEBTEPNEFER INTEF", 8],
        ["NEBHEPETRE MENTUHOTEP", 51],
        ["SANKHKARE MENTUHOTEP", 12],
        ["SEHETEPIBRE AMENEMHAT", 30],
        ["KHEPERKARE SENUSRET", 45],
        ["NUBKAURE AMENEMHAT", 35],
        ["KHAKHEPERRE SENUSRET", 19],
        ["KHAKAURE SENUSRET", 39],
        ["NIMAATRE AMENEMHAT", 45],
        ["MAATKHERURE AMENEMHAT", 9],
        ["SOBEKNEFERU", 4],
        ["WEGAF", 2],
        ["SEKHEMKARE AMENEMHAT", 3],
        ["KHASEKHEMRE NEFERHOTEP", 11],
        ["KHANEFERRE SOBEKHOTEP", 10],
        ["MERNEFERRE AY", 23],
        ["SALITIS", 20],
        ["KHYAN", 40],
        ["APOPI", 40],
        ["KHAMUDI", 10],
        ["NEBPEHTIRE AHMOSE", 25],
        ["DJESERKAURE AMENHOTEP", 21],
        ["AAKHEPERKARE THUTMOSE", 12],
        ["AAKHEPERENRE THUTMOSE", 14],
        ["HATSHEPSUT", 22],
        ["MENKHEPERRE THUTMOSE", 54],
        ["AAKHEPERURE AMENHOTEP", 26],
        ["MENKHEPERURE THUTMOSE", 10],
        ["NEBMAATRE AMENHOTEP", 38],
        ["AKHENATEN", 17],
        ["SMENKHKARE", 1],
        ["TUTANKHAMUN", 9],
        ["AY", 4],
        ["HOREMHEB", 14],
        ["MENPEHTYRE RAMESSES", 2],
        ["MENMAATRE SETI", 11],
        ["USERMAATRE RAMESSES", 66],
        ["MERNEPTAH", 10],
        ["USERKHEPERURE SETI", 6],
        ["AMENMESSE", 4],
        ["SIPTAH", 6],
        ["TWOSRET", 2],
        ["SETNAKHTE", 3],
        ["USERMAATRE MERYAMUN RAMESSES", 31],
        ["HEQAMAATRE RAMESSES", 6],
        ["USERMAATRE SEKHEPERENRE RAMESSES", 4],
        ["NEBMAATRE MERYAMUN RAMESSES", 8],
        ["USERMAATRE SETEPENRE MERYAMUN RAMESSES", 7],
        ["USERMAATRE AKHENAMUN RAMESSES", 1],
        ["NEFERKARE SETEPENRE RAMESSES", 18],
        ["KHEPERMAATRE RAMESSES", 9],
        ["MENMAATRE SETEPENPTAH RAMESSES", 30],
        ["SMENDES", 26],
        ["AMENEMNISU", 4],
        ["AAKHEPERRE PSUSENNES", 46],
        ["AMENEMOPE", 9],
        ["AAKHEPERRE SETEPENRE OSORKON", 6],
        ["SIAMUN", 19],
        ["TITKHEPERURE PSUSENNES", 14],
        ["HEDJKHEPERRE SHOSHENQ", 21],
        ["SEKHEMKHEPERRE OSORKON", 15],
        ["HEDJKHEPERRE TAKELOT", 13],
        ["USERMAATRE SETEPENAMUN OSORKON", 24],
        ["USERMAATRE SETEPENRE SHOSHENQ", 39],
        ["AAKHEPERRE SHOSHENQ", 37],
        ["AAKHEPERRE SETEPENAMUN OSORKON", 10],
        ["PIYE", 31]
    ];


	const KINGS = [
        { prima: 'ROMVLVS', secunda: '', jdnstr: 1446675, jdnend: 1460190 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1460190, jdnend: 1460555 },
        { prima: 'NVMA POMPILIVS', secunda: '', jdnstr: 1460555, jdnend: 1475895 },
        { prima: 'TVLLVS HOSTILIVS', secunda: '', jdnstr: 1475895, jdnend: 1487218 },
        { prima: 'ANCVS MARCIVS', secunda: '', jdnstr: 1487218, jdnend: 1496349 },
        { prima: 'TARQVINIVS PRISCVS', secunda: '', jdnstr: 1496349, jdnend: 1510229 },
        { prima: 'SERVIVS TVLLIVS', secunda: '', jdnstr: 1510229, jdnend: 1526300 },
        { prima: 'TARQVINIVS SVPERBVS', secunda: '', jdnstr: 1526300, jdnend: 1535870 },
        { prima: 'L. JVNIVS BRVTVS', secunda: 'L. TARQVINIVS COLLATINVS', jdnstr: 1535870, jdnend: 1536236 },
        { prima: 'P. VALERIVS POPLICOLA', secunda: 'T. LVCRETIVS TRICIPITINVS', jdnstr: 1536236, jdnend: 1536601 },
        { prima: 'P. VALERIVS POPLICOLA', secunda: 'M. HORATIVS PVLVILLVS', jdnstr: 1536601, jdnend: 1536966 },
        { prima: 'SP. LARCIVS', secunda: 'T. HERMINIVS AQVILINVS', jdnstr: 1536966, jdnend: 1537331 },
        { prima: 'M. VALERIVS VOLVSVS', secunda: 'P. POSTVMIVS TVBERTVS', jdnstr: 1537331, jdnend: 1537697 },
        { prima: 'P. VALERIVS POPLICOLA', secunda: 'T. LVCRETIVS TRICIPITINVS', jdnstr: 1537697, jdnend: 1538062 },
        { prima: 'AGRIPPA MENENIVS LANATVS', secunda: 'P. POSTVMIVS TVBERTVS', jdnstr: 1538062, jdnend: 1538427 },
        { prima: 'OPITER VERGINIVS TRICOSTVS', secunda: 'SP. CASSIVS VECELLINVS', jdnstr: 1538427, jdnend: 1538792 },
        { prima: 'POSTVMVS COMINIVS AVRVNCVS', secunda: 'T. LARCIVS', jdnstr: 1538792, jdnend: 1539158 },
        { prima: 'SER. SVLPICIVS CAMERINVS CORNVTVS', secunda: 'M\'. TVLLIVS LONGVS', jdnstr: 1539158, jdnend: 1539523 },
        { prima: 'T. AEBVTIVS HELVA', secunda: 'C. VETVRIVS GEMINVS CICVRINVS', jdnstr: 1539523, jdnend: 1539888 },
        { prima: 'Q. CLOELIVS SICVLVS', secunda: 'T. LARCIVS', jdnstr: 1539888, jdnend: 1540253 },
        { prima: 'A. SEMPRONIVS ATRATINVS', secunda: 'M. MINVCIVS AVGVRINVS', jdnstr: 1540253, jdnend: 1540619 },
        { prima: 'A. POSTVMIVS ALBVS REGILLENSIS', secunda: 'T. VERGINIVS TRICOSTVS CAELIOMONTANVS', jdnstr: 1540619, jdnend: 1540984 },
        { prima: 'AP. CLAVDIVS SABINVS INREGILLENSIS', secunda: 'P. SERVILIVS PRISCVS STRVCTVS', jdnstr: 1540984, jdnend: 1541349 },
        { prima: 'A. VERGINIVS TRICOSTVS CAELIOMONTANVS', secunda: 'T. VETVRIVS GEMINVS CICVRINVS', jdnstr: 1541349, jdnend: 1541714 },
        { prima: 'POSTVMVS COMINIVS AVRVNCVS', secunda: 'SP. CASSIVS VECELLINVS', jdnstr: 1541714, jdnend: 1542080 },
        { prima: 'T. GEGANIVS MACERINVS', secunda: 'P. MINVCIVS AVGVRINVS', jdnstr: 1542080, jdnend: 1542445 },
        { prima: 'M. MINVCIVS AVGVRINVS', secunda: 'A. SEMPRONIVS ATRATINVS', jdnstr: 1542445, jdnend: 1542810 },
        { prima: 'Q. SVLPICIVS CAMERINVS CORNVTVS', secunda: 'SP. LARCIVS', jdnstr: 1542810, jdnend: 1543175 },
        { prima: 'C. JVLIVS IVLLVS', secunda: 'P. PINARIVS MAMERCINVS RVFVS', jdnstr: 1543175, jdnend: 1543541 },
        { prima: 'SP. NAVTIVS RVTILVS', secunda: 'SEX. FVRIVS', jdnstr: 1543541, jdnend: 1543906 },
        { prima: 'T. SICINIVS (OR SICCIVS) SABINVS', secunda: 'C. AQVILLIVS TVSCVS', jdnstr: 1543906, jdnend: 1544271 },
        { prima: 'SP. CASSIVS VECELLINVS', secunda: 'PROCVLVS VERGINIVS TRICOSTVS RVTILVS', jdnstr: 1544271, jdnend: 1544636 },
        { prima: 'Q. FABIVS VIBVLANVS', secunda: 'SER. CORNELIVS MALVGINENSIS', jdnstr: 1544636, jdnend: 1545002 },
        { prima: 'L. AEMILIVS MAMERCVS', secunda: 'K. FABIVS VIBVLANVS', jdnstr: 1545002, jdnend: 1545367 },
        { prima: 'M. FABIVS VIBVLANVS', secunda: 'L. VALERIVS POTITVS', jdnstr: 1545367, jdnend: 1545732 },
        { prima: 'C. JVLIVS IVLLVS', secunda: 'Q. FABIVS VIBVLANVS', jdnstr: 1545732, jdnend: 1546097 },
        { prima: 'K. FABIVS VIBVLANVS', secunda: 'SP. FVRIVS FVSVS', jdnstr: 1546097, jdnend: 1546463 },
        { prima: 'M. FABIVS VIBVLANVS', secunda: 'CN. MANLIVS CINCINNATVS', jdnstr: 1546463, jdnend: 1546828 },
        { prima: 'K. FABIVS VIBVLANVS', secunda: 'T. VERGINIVS TRICOSTVS RVTILVS', jdnstr: 1546828, jdnend: 1547193 },
        { prima: 'L. AEMILIVS MAMERCVS', secunda: 'C. SERVILIVS STRVCTVS AHALA', jdnstr: 1547193, jdnend: 1547558 },
        { prima: 'C. (OR M.) HORATIVS PVLVILLVS', secunda: 'T. MENENIVS LANATVS', jdnstr: 1547558, jdnend: 1547924 },
        { prima: 'A. VERGINIVS TRICOSTVS RVTILVS', secunda: 'SP. (OR C.) SERVILIVS STRVCTVS', jdnstr: 1547924, jdnend: 1548289 },
        { prima: 'P. VALERIVS POPLICOLA', secunda: 'C. NAVTIVS RVTILVS', jdnstr: 1548289, jdnend: 1548654 },
        { prima: 'L. FVRIVS MEDVLLINVS', secunda: 'A. MANLIVS VVLSO', jdnstr: 1548654, jdnend: 1549019 },
        { prima: 'L. AEMILIVS MAMERCVS', secunda: 'VOPISCVS JVLIVS IVLLVS', jdnstr: 1549019, jdnend: 1549385 },
        { prima: 'L. PINARIVS MAMERCINVS RVFVS', secunda: 'P. FVRIVS MEDVLLINVS FVSVS', jdnstr: 1549385, jdnend: 1549750 },
        { prima: 'AP. CLAVDIVS CRASSVS INREGILLENSIS SABINVS', secunda: 'T. QVINCTIVS CAPITOLINVS BARBATVS', jdnstr: 1549750, jdnend: 1550115 },
        { prima: 'L. VALERIVS POTITVS', secunda: 'TI. AEMILIVS MAMERCVS', jdnstr: 1550115, jdnend: 1550480 },
        { prima: 'T. NVMICIVS PRISCVS', secunda: 'A. VERGINIVS CAELIOMONTANVS', jdnstr: 1550480, jdnend: 1550846 },
        { prima: 'T. QVINCTIVS CAPITOLINVS BARBATVS', secunda: 'Q. SERVILIVS PRISCVS', jdnstr: 1550846, jdnend: 1551211 },
        { prima: 'TI. AEMILIVS MAMERCVS', secunda: 'Q. FABIVS VIBVLANVS', jdnstr: 1551211, jdnend: 1551576 },
        { prima: 'Q. SERVILIVS PRISCVS', secunda: 'SP. POSTVMIVS ALBINVS REGILLENSIS', jdnstr: 1551576, jdnend: 1551941 },
        { prima: 'Q. FABIVS VIBVLANVS', secunda: 'T. QVINCTIVS CAPITOLINVS BARBATVS', jdnstr: 1551941, jdnend: 1552307 },
        { prima: 'A. POSTVMIVS ALBINVS REGILLENSIS', secunda: 'SP. FVRIVS MEDVLLINVS FVSVS', jdnstr: 1552307, jdnend: 1552672 },
        { prima: 'P. SERVILIVS PRISCVS', secunda: 'L. AEBVTIVS HELVA', jdnstr: 1552672, jdnend: 1553037 },
        { prima: 'L. LVCRETIVS TRICIPITINVS', secunda: 'T. VETVRIVS GEMINVS CICVRINVS', jdnstr: 1553037, jdnend: 1553402 },
        { prima: 'P. VOLVMNIVS AMINTINVS GALLVS', secunda: 'SER. SVLPICIVS CAMERINVS CORNVTVS', jdnstr: 1553402, jdnend: 1553768 },
        { prima: 'P. VALERIVS POPLICOLA', secunda: 'C. CLAVDIVS INREGILLENSIS SABINVS', jdnstr: 1553768, jdnend: 1554133 },
        { prima: 'Q. FABIVS VIBVLANVS', secunda: 'L. CORNELIVS MALVGINENSIS VRITINVS', jdnstr: 1554133, jdnend: 1554498 },
        { prima: 'C. NAVTIVS RVTILVS', secunda: '(...) CARVE(NTANVS?)', jdnstr: 1554498, jdnend: 1554863 },
        { prima: 'C. (OR M.) HORATIVS PVLVILLVS', secunda: 'Q. MINVCIVS ESQVILINVS (OR L. POSTVMIVS)', jdnstr: 1554863, jdnend: 1555229 },
        { prima: 'M. VALERIVS MAXIMVS LACTVCA', secunda: 'SP. VERGINIVS TRICOSTVS CAELIOMONTANVS', jdnstr: 1555229, jdnend: 1555594 },
        { prima: 'T. ROMILIVS ROCVS VATICANVS', secunda: 'C. VETVRIVS CICVRINVS', jdnstr: 1555594, jdnend: 1555959 },
        { prima: 'SP. TARPEIVS MONTANVS CAPITOLINVS', secunda: 'A. ATERNIVS VARVS FONTINALIS', jdnstr: 1555959, jdnend: 1556324 },
        { prima: 'P. CVRIATIVS FISTVS TRIGEMINVS', secunda: 'SEX. QVINCTILIVS', jdnstr: 1556324, jdnend: 1556690 },
        { prima: 'T. MENENIVS LANATVS', secunda: 'P. SESTIVS CAPITOLINVS VATICANVS', jdnstr: 1556690, jdnend: 1557055 },
        { prima: 'AP. CLAVDIVS CRASSVS INREGILLENSIS SABINVS', secunda: 'T. GENVCIVS (OR MINVCIVS) AVGVRINVS', jdnstr: 1557055, jdnend: 1557420 },
        { prima: 'PLACIDVS VALENTINIANVS AVGVSTVS', secunda: 'GENNADIVS AVIENVS', jdnstr: 1557420, jdnend: 1557785 },
        { prima: 'L. VALERIVS POPLICOLA POTITVS', secunda: 'M. HORATIVS TVRRINVS BARBATVS', jdnstr: 1557785, jdnend: 1558151 },
        { prima: 'LARS HERMINIVS CORITINESANVS', secunda: 'T. VERGINIVS TRICOSTVS CAELIOMONTANVS', jdnstr: 1558151, jdnend: 1558516 },
        { prima: 'M. GEGANIVS MACERINVS', secunda: 'C. JVLIVS IVLLVS', jdnstr: 1558516, jdnend: 1558881 },
        { prima: 'T. QVINCTIVS CAPITOLINVS BARBATVS', secunda: 'AGRIPPA FVRIVS FVSVS', jdnstr: 1558881, jdnend: 1559246 },
        { prima: 'M. GENVCIVS AVGVRINVS', secunda: 'C. CVRIATIVS PHILO', jdnstr: 1559246, jdnend: 1559612 },
        { prima: 'THEODOSIVS AVGVSTVS XVIII', secunda: 'CAECINA DECIVS AGINATIVS ALBINVS', jdnstr: 1559612, jdnend: 1559977 },
        { prima: 'M. GEGANIVS MACERINVS', secunda: 'T. QVINCTIVS CAPITOLINVS BARBATVS', jdnstr: 1559977, jdnend: 1560342 },
        { prima: 'M. FABIVS VIBVLANVS', secunda: 'POSTVMVS AEBVTIVS HELVA CORNICEN', jdnstr: 1560342, jdnend: 1560707 },
        { prima: 'C. FVRIVS PACILVS FVSVS', secunda: 'M\'. PAPIRIVS CRASSVS', jdnstr: 1560707, jdnend: 1561073 },
        { prima: 'PROCVLVS GEGANIVS MACERINVS', secunda: 'T. MENENIVS LANATVS', jdnstr: 1561073, jdnend: 1561438 },
        { prima: 'AGRIPPA MENENIVS LANATVS', secunda: 'T. QVINCTIVS CAPITOLINVS BARBATVS', jdnstr: 1561438, jdnend: 1561803 },
        { prima: 'THEODOSIVS AVGVSTVS XVI', secunda: 'ANICIVS ACILIVS GLABRIO FAVSTVS', jdnstr: 1561803, jdnend: 1562168 },
        { prima: 'M. GEGANIVS MACERINVS', secunda: 'L. SERGIVS FIDENAS', jdnstr: 1562168, jdnend: 1562534 },
        { prima: 'M. (OR A.) CORNELIVS MALVGINENSIS', secunda: 'L. PAPIRIVS CRASSVS', jdnstr: 1562534, jdnend: 1562899 },
        { prima: 'C. JVLIVS IVLLVS', secunda: '(L. OR PROCVLVS) VERGINIVS TRICOSTVS', jdnstr: 1562899, jdnend: 1563264 },
        { prima: 'ARDABVR ASPAR (WESTERN)', secunda: 'AREOBINDVS (EASTERN)', jdnstr: 1563264, jdnend: 1563629 },
        { prima: 'THEODOSIVS AVGVSTVS XIV', secunda: 'PETRONIVS MAXIMVS', jdnstr: 1563629, jdnend: 1563995 },
        { prima: 'AETIVS (WESTERN)', secunda: 'VALERIVS (EASTERN)', jdnstr: 1563995, jdnend: 1564360 },
        { prima: 'T. QVINCTIVS POENVS CINCINNATVS', secunda: 'C. JVLIVS MENTO', jdnstr: 1564360, jdnend: 1564725 },
        { prima: 'C. (OR L.) PAPIRIVS CRASSVS', secunda: 'L. JVLIVS IVLLVS', jdnstr: 1564725, jdnend: 1565090 },
        { prima: 'HOSTVS LVCRETIVS TRICIPITINVS', secunda: 'L. SERGIVS FIDENAS', jdnstr: 1565090, jdnend: 1565456 },
        { prima: 'A. CORNELIVS COSSVS', secunda: 'T. QVINCTIVS POENVS CINCINNATVS', jdnstr: 1565456, jdnend: 1565821 },
        { prima: 'C. SERVILIVS AXILLA', secunda: 'L. PAPIRIVS MVGILLANVS', jdnstr: 1565821, jdnend: 1566186 },
        { prima: 'THEODOSIVS AVGVSTVS XII', secunda: 'PLACIDVS VALENTINIANVS AVGVSTVS', jdnstr: 1566186, jdnend: 1566551 },
        { prima: 'WEST: JOHANNES AVGVSTVS', secunda: '', jdnstr: 1566551, jdnend: 1566917 },
        { prima: 'CASTINVS (WEST ONLY)', secunda: 'VICTOR (EAST ONLY)', jdnstr: 1566917, jdnend: 1567282 },
        { prima: 'C. SEMPRONIVS ATRATINVS', secunda: 'Q. FABIVS VIBVLANVS', jdnstr: 1567282, jdnend: 1567647 },
        { prima: 'HONORIVS AVGVSTVS XIII', secunda: 'THEODOSIVS AVGVSTVS X', jdnstr: 1567647, jdnend: 1568012 },
        { prima: 'N. (OR CN.) FABIVS VIBVLANVS', secunda: 'T. QVINCTIVS CAPITOLINVS BARBATVS', jdnstr: 1568012, jdnend: 1568378 },
        { prima: 'THEODOSIVS AVGVSTVS IX', secunda: 'CONSTANTIVS', jdnstr: 1568378, jdnend: 1568743 },
        { prima: 'MONAXIVS', secunda: 'PLINTA', jdnstr: 1568743, jdnend: 1569108 },
        { prima: 'HONORIVS AVGVSTVS XII', secunda: 'THEODOSIVS AVGVSTVS VIII', jdnstr: 1569108, jdnend: 1569473 },
        { prima: 'HONORIVS AVGVSTVS XI', secunda: 'CONSTANTIVS', jdnstr: 1569473, jdnend: 1569839 },
        { prima: 'THEODOSIVS AVGVSTVS', secunda: 'JVNIVS QVARTVS PALLADIVS', jdnstr: 1569839, jdnend: 1570204 },
        { prima: 'HONORIVS AVGVSTVS X', secunda: 'THEODOSIVS AVGVSTVS', jdnstr: 1570204, jdnend: 1570569 },
        { prima: 'CONSTANTIVS', secunda: 'CONSTANS', jdnstr: 1570569, jdnend: 1570934 },
        { prima: '(A. OR M.) CORNELIVS COSSVS', secunda: 'L. FVRIVS MEDVLLINVS', jdnstr: 1570934, jdnend: 1571300 },
        { prima: 'Q. FABIVS VIBVLANVS (?)AMBVSTVS (II?)', secunda: 'C. FVRIVS PACILVS', jdnstr: 1571300, jdnend: 1571665 },
        { prima: 'M. PAPIRIVS MVGILLANVS', secunda: 'SP. (OR C.) NAVTIVS RVTILVS', jdnstr: 1571665, jdnend: 1572030 },
        { prima: 'M\'. AEMILIVS MAMERCINVS', secunda: 'C. VALERIVS POTITVS VOLVSVS', jdnstr: 1572030, jdnend: 1572395 },
        { prima: 'CN. CORNELIVS COSSVS', secunda: 'L. FVRIVS MEDVLLINVS', jdnstr: 1572395, jdnend: 1572761 },
        { prima: 'ANICIVS AVCHENIVS BASSVS', secunda: 'PHILIPPVS', jdnstr: 1572761, jdnend: 1573126 },
        { prima: 'HONORIVS AVGVSTVS', secunda: 'THEODOSIVS AVGVSTVS', jdnstr: 1573126, jdnend: 1573491 },
        { prima: 'ARCADIVS AVGVSTVS', secunda: 'ANICIVS PETRONIVS PROBVS', jdnstr: 1573491, jdnend: 1573856 },
        { prima: 'STILICHO', secunda: 'ANTHEMIVS (EAST ONLY)', jdnstr: 1573856, jdnend: 1574222 },
        { prima: 'HONORIVS AVGVSTVS', secunda: 'ARISTAENETVS (EAST ONLY)', jdnstr: 1574222, jdnend: 1574587 },
        { prima: 'THEODOSIVS AVGVSTVS', secunda: 'RVMORIDVS', jdnstr: 1574587, jdnend: 1574952 },
        { prima: 'ARCADIVS AVGVSTVS', secunda: 'HONORIVS AVGVSTVS', jdnstr: 1574952, jdnend: 1575317 },
        { prima: 'VINCENTIVS', secunda: 'FRAVITTA', jdnstr: 1575317, jdnend: 1575683 },
        { prima: 'STILICHO', secunda: 'AVRELIANVS (EAST ONLY)', jdnstr: 1575683, jdnend: 1576048 },
        { prima: 'MALLIVS THEODORVS (WESTERN)', secunda: 'EVTROPIVS (EAST ONLY, VNTIL AVGVST)', jdnstr: 1576048, jdnend: 1576413 },
        { prima: 'HONORIVS AVGVSTVS', secunda: 'EVTYCHIANVS', jdnstr: 1576413, jdnend: 1576778 },
        { prima: 'CAESARIVS', secunda: 'NONIVS ATTICVS', jdnstr: 1576778, jdnend: 1577144 },
        { prima: 'ARCADIVS AVGVSTVS', secunda: 'HONORIVS AVGVSTVS', jdnstr: 1577144, jdnend: 1577509 },
        { prima: 'ANICIVS HERMOGENIANVS OLYBRIVS', secunda: 'ANICIVS PROBINVS', jdnstr: 1577509, jdnend: 1577874 },
        { prima: 'WEST: VIRIVS NICOMACHVS FLAVIANVS', secunda: '', jdnstr: 1577874, jdnend: 1578239 },
        { prima: 'L. VALERIVS POTITVS (INVALIDATED)', secunda: 'CORNELIVS MALVGINENSIS (INVALIDATED)', jdnstr: 1578239, jdnend: 1578605 },
        { prima: 'L. VALERIVS POTITVS', secunda: 'M. MANLIVS CAPITOLINVS', jdnstr: 1578605, jdnend: 1578970 },
        { prima: 'EVTOLMIVS TATIANVS', secunda: 'Q. AVRELIVS SYMMACHVS', jdnstr: 1578970, jdnend: 1579335 },
        { prima: 'VALENTINIANVS AVGVSTVS', secunda: 'NEOTERIVS', jdnstr: 1579335, jdnend: 1579700 },
        { prima: 'TIMASIVS', secunda: 'PROMOTVS', jdnstr: 1579700, jdnend: 1580066 },
        { prima: 'WEST: MEROBAVDES III? (VNTIL 10 JANVARY?)', secunda: 'VNKNOWN COLLEAGVE?', jdnstr: 1580066, jdnend: 1580431 },
        { prima: 'VALENTINIANVS AVGVSTVS', secunda: 'EVTROPIVS', jdnstr: 1580431, jdnend: 1580796 },
        { prima: 'HONORIVS', secunda: 'EVODIVS', jdnstr: 1580796, jdnend: 1581161 },
        { prima: 'ARCADIVS AVGVSTVS', secunda: 'BAVTO', jdnstr: 1581161, jdnend: 1581527 },
        { prima: 'RICOMER', secunda: 'CLEARCHVS', jdnstr: 1581527, jdnend: 1581892 },
        { prima: 'MEROBAVDES', secunda: 'SATVRNINVS', jdnstr: 1581892, jdnend: 1582257 },
        { prima: 'CLAVDIVS ANTONIVS', secunda: 'AFRANIVS SYAGRIVS', jdnstr: 1582257, jdnend: 1582622 },
        { prima: 'SYAGRIVS (WESTERN)', secunda: 'EVCHERIVS (EASTERN)', jdnstr: 1582622, jdnend: 1582988 },
        { prima: 'GRATIANVS AVGVSTVS', secunda: 'THEODOSIVS AVGVSTVS', jdnstr: 1582988, jdnend: 1583353 },
        { prima: 'DECIMIVS MAGNVS AVSONIVS', secunda: 'Q. CLODIVS HERMOGENIANVS OLYBRIVS', jdnstr: 1583353, jdnend: 1583718 },
        { prima: 'VALENS AVGVSTVS', secunda: 'VALENTINIANVS (JVNIOR) AVGVSTVS', jdnstr: 1583718, jdnend: 1584083 },
        { prima: 'GRATIANVS AVGVSTVS', secunda: 'MEROBAVDES', jdnstr: 1584083, jdnend: 1584449 },
        { prima: 'VALENS AVGVSTVS', secunda: 'VALENTINIANVS (JVNIOR) AVGVSTVS', jdnstr: 1584449, jdnend: 1584814 },
        { prima: 'POST CONSVLATVM GRATIANI AVGVSTI III ET EQVITII', secunda: '', jdnstr: 1584814, jdnend: 1585179 },
        { prima: 'GRATIANVS AVGVSTVS', secunda: 'EQVITIVS', jdnstr: 1585179, jdnend: 1585544 },
        { prima: 'VALENTINIANVS AVGVSTVS', secunda: 'VALENS AVGVSTVS', jdnstr: 1585544, jdnend: 1585910 },
        { prima: 'DOMITIVS MODESTVS', secunda: 'ARINTHEVS', jdnstr: 1585910, jdnend: 1586275 },
        { prima: 'GRATIANVS AVGVSTVS', secunda: 'SEX. CLAVDIVS PETRONIVS PROBVS', jdnstr: 1586275, jdnend: 1586640 },
        { prima: 'VALENTINIANVS AVGVSTVS', secunda: 'VALENS AVGVSTVS', jdnstr: 1586640, jdnend: 1587005 },
        { prima: 'VALENTINIANVS (GALATES)', secunda: 'VICTOR', jdnstr: 1587005, jdnend: 1587371 },
        { prima: 'VALENTINIANVS AVGVSTVS', secunda: 'VALENS AVGVSTVS', jdnstr: 1587371, jdnend: 1587736 },
        { prima: 'LVPICINVS', secunda: 'JOVINVS', jdnstr: 1587736, jdnend: 1588101 },
        { prima: 'L. AEMILIVS MAMERCINVS', secunda: 'L. SEXTIVS SEXTINVS LATERANVS', jdnstr: 1588101, jdnend: 1588466 },
        { prima: 'L. GENVCIVS AVENTINENSIS', secunda: 'Q. SERVILIVS AHALA', jdnstr: 1588466, jdnend: 1588832 },
        { prima: 'C. SVLPICIVS PETICVS', secunda: 'C. LICINIVS CALVVS', jdnstr: 1588832, jdnend: 1589197 },
        { prima: 'CN. GENVCIVS AVENTINENSIS', secunda: 'L. AEMILIVS MAMERCINVS', jdnstr: 1589197, jdnend: 1589562 },
        { prima: 'Q. SERVILIVS AHALA', secunda: 'L. GENVCIVS AVENTINENSIS', jdnstr: 1589562, jdnend: 1589927 },
        { prima: 'C. LICINIVS STOLO', secunda: 'C. SVLPICIVS PETICVS', jdnstr: 1589927, jdnend: 1590293 },
        { prima: 'M. FABIVS AMBVSTVS', secunda: 'C. POETELIVS LIBO VISOLVS', jdnstr: 1590293, jdnend: 1590658 },
        { prima: 'M. POPILLIVS LAENAS', secunda: 'CN. MANLIVS CAPITOLINVS IMPERIOSVS', jdnstr: 1590658, jdnend: 1591023 },
        { prima: 'C. FABIVS AMBVSTVS', secunda: 'C. PLAVTIVS PROCVLVS', jdnstr: 1591023, jdnend: 1591388 },
        { prima: 'C. MARCIVS RVTILVS', secunda: 'CN. MANLIVS CAPITOLINVS (IMPERIOSVS II?)', jdnstr: 1591388, jdnend: 1591754 },
        { prima: 'M. FABIVS AMBVSTVS', secunda: 'M. POPILLIVS LAENAS', jdnstr: 1591754, jdnend: 1592119 },
        { prima: 'C. SVLPICIVS PETICVS', secunda: 'M. VALERIVS POPLICOLA', jdnstr: 1592119, jdnend: 1592484 },
        { prima: 'M. FABIVS AMBVSTVS', secunda: 'T. QVINCTIVS POENVS CAPITOLINVS CRISPINVS', jdnstr: 1592484, jdnend: 1592849 },
        { prima: 'C. SVLPICIVS PETICVS', secunda: 'M. VALERIVS POPLICOLA', jdnstr: 1592849, jdnend: 1593215 },
        { prima: 'P. VALERIVS POPLICOLA', secunda: 'C. MARCIVS RVTILVS', jdnstr: 1593215, jdnend: 1593580 },
        { prima: 'C. SVLPICIVS PETICVS', secunda: 'T. (OR C. OR K.) QVINCTIVS POENVS (II?)', jdnstr: 1593580, jdnend: 1593945 },
        { prima: 'M. POPILLIVS LAENAS', secunda: 'L. CORNELIVS SCIPIO', jdnstr: 1593945, jdnend: 1594310 },
        { prima: 'L. FVRIVS CAMILLVS', secunda: 'AP. CLAVDIVS CRASSVS INREGILLENSIS', jdnstr: 1594310, jdnend: 1594676 },
        { prima: 'M. VALERIVS CORVVS', secunda: 'M. POPILLIVS LAENAS', jdnstr: 1594676, jdnend: 1595041 },
        { prima: 'C. PLAVTIVS VENNO (OR VENOX)', secunda: 'T. MANLIVS IMPERIOSVS TORQVATVS', jdnstr: 1595041, jdnend: 1595406 },
        { prima: 'M. VALERIVS CORVVS', secunda: 'C. POETELIVS LIBO VISOLVS', jdnstr: 1595406, jdnend: 1595771 },
        { prima: 'M. FABIVS DORSVO', secunda: 'SER. SVLPICIVS CAMERINVS RVFVS', jdnstr: 1595771, jdnend: 1596137 },
        { prima: 'C. MARCIVS RVTILVS', secunda: 'T. MANLIVS IMPERIOSVS TORQVATVS', jdnstr: 1596137, jdnend: 1596502 },
        { prima: 'M. VALERIVS CORVVS', secunda: 'A. CORNELIVS COSSVS ARVINA', jdnstr: 1596502, jdnend: 1596867 },
        { prima: 'Q. SERVILIVS AHALA', secunda: 'C. MARCIVS RVTILVS', jdnstr: 1596867, jdnend: 1597232 },
        { prima: 'C. PLAVTIVS VENNO (OR VENOX)', secunda: 'L. AEMILIVS MAMERCINVS PRIVERNAS', jdnstr: 1597232, jdnend: 1597598 },
        { prima: 'T. MANLIVS IMPERIOSVS TORQVATVS', secunda: 'P. DECIVS MVS', jdnstr: 1597598, jdnend: 1597963 },
        { prima: 'TI. AEMILIVS MAMERCINVS', secunda: 'Q. PVBLILIVS PHILO', jdnstr: 1597963, jdnend: 1598328 },
        { prima: 'L. FVRIVS CAMILLVS', secunda: 'C. MAENIVS', jdnstr: 1598328, jdnend: 1598693 },
        { prima: 'C. SVLPICIVS LONGVS', secunda: 'P. AELIVS PAETVS', jdnstr: 1598693, jdnend: 1599059 },
        { prima: 'L. PAPIRIVS CRASSVS', secunda: 'K. DVILIVS', jdnstr: 1599059, jdnend: 1599424 },
        { prima: 'M. ATILIVS REGVLVS CALENVS', secunda: 'M. VALERIVS CORVVS', jdnstr: 1599424, jdnend: 1599789 },
        { prima: 'SP. POSTVMIVS ALBINVS (CAVDINVS)', secunda: 'T. VETVRIVS CALVINVS', jdnstr: 1599789, jdnend: 1600154 },
        { prima: 'FLAVIVS DALMATIVS', secunda: 'DOMITIVS ZENOFILVS', jdnstr: 1600154, jdnend: 1600520 },
        { prima: 'CN. DOMITIVS CALVINVS', secunda: 'A. CORNELIVS COSSVS ARVINA', jdnstr: 1600520, jdnend: 1600885 },
        { prima: 'C. VALERIVS POTITVS', secunda: 'M. CLAVDIVS MARCELLVS', jdnstr: 1600885, jdnend: 1601250 },
        { prima: 'L. PAPIRIVS CRASSVS', secunda: 'L. PLAVTIVS VENNO (OR VENOX)', jdnstr: 1601250, jdnend: 1601615 },
        { prima: 'L. AEMILIVS MAMERCINVS PRIVERNAS', secunda: 'C. PLAVTIVS DECIANVS', jdnstr: 1601615, jdnend: 1601981 },
        { prima: 'PLAVTIVS', secunda: 'P. CORNELIVS (SCAPVLA OR SCIPIO BARBATVS)', jdnstr: 1601981, jdnend: 1602346 },
        { prima: 'L. CORNELIVS LENTVLVS', secunda: 'Q. PVBLILIVS PHILO', jdnstr: 1602346, jdnend: 1602711 },
        { prima: 'C. POETELIVS LIBO VISOLVS', secunda: 'L. PAPIRIVS CVRSOR', jdnstr: 1602711, jdnend: 1603076 },
        { prima: 'L. FVRIVS CAMILLVS', secunda: 'D. JVNIVS BRVTVS SCAEVA', jdnstr: 1603076, jdnend: 1603442 },
        { prima: 'FLAVIVS JVLIVS CRISPVS CAESAR', secunda: 'FLAVIVS CLAVDIVS CONSTANTINVS CAESAR', jdnstr: 1603442, jdnend: 1603807 },
        { prima: 'C. SVLPICIVS LONGVS', secunda: 'Q. AVLIVS CERRETANVS', jdnstr: 1603807, jdnend: 1604172 },
        { prima: 'Q. FABIVS MAXIMVS RVLLIANVS', secunda: 'L. FVLVIVS CVRVVS', jdnstr: 1604172, jdnend: 1604537 },
        { prima: 'T. VETVRIVS CALVINVS', secunda: 'SP. POSTVMIVS ALBINVS CAVDINVS', jdnstr: 1604537, jdnend: 1604903 },
        { prima: 'Q. PVBLILIVS PHILO', secunda: 'L. PAPIRIVS CVRSOR', jdnstr: 1604903, jdnend: 1605268 },
        { prima: 'L. PAPIRIVS CVRSOR', secunda: 'Q. AVLIVS CERRETANVS', jdnstr: 1605268, jdnend: 1605633 },
        { prima: 'M. FOLIVS FLACCINATOR', secunda: 'L. PLAVTIVS VENNO (OR VENOX)', jdnstr: 1605633, jdnend: 1605998 },
        { prima: 'C. JVNIVS BVBVLCVS BRVTVS', secunda: 'Q. AEMILIVS BARBVLA', jdnstr: 1605998, jdnend: 1606364 },
        { prima: 'SP. NAVTIVS RVTILVS', secunda: 'M. POPILLIVS LAENAS', jdnstr: 1606364, jdnend: 1606729 },
        { prima: 'L. PAPIRIVS CVRSOR', secunda: 'Q. PVBLILIVS PHILO', jdnstr: 1606729, jdnend: 1607094 },
        { prima: 'M. POETELIVS LIBO', secunda: 'C. SVLPICIVS LONGVS', jdnstr: 1607094, jdnend: 1607459 },
        { prima: 'L. PAPIRIVS CVRSOR', secunda: 'C. JVNIVS BVBVLCVS BRVTVS', jdnstr: 1607459, jdnend: 1607825 },
        { prima: 'M. VALERIVS MAXIMVS CORVVS', secunda: 'P. DECIVS MVS', jdnstr: 1607825, jdnend: 1608190 },
        { prima: 'C. JVNIVS BVBVLCVS BRVTVS', secunda: 'Q. AEMILIVS BARBVLA', jdnstr: 1608190, jdnend: 1608555 },
        { prima: 'Q. FABIVS MAXIMVS RVLLIANVS', secunda: 'C. MARCIVS RVTILVS (CENSORINVS)', jdnstr: 1608555, jdnend: 1608920 },
        { prima: 'EAST: VALERIVS LICINIANVS LICINIVS AVGVSTVS', secunda: 'FLAVIVS VALERIVS CONSTANTINVS CAESAR', jdnstr: 1608920, jdnend: 1609286 },
        { prima: 'P. DECIVS MVS', secunda: 'Q. FABIVS MAXIMVS RVLLIANVS', jdnstr: 1609286, jdnend: 1609651 },
        { prima: 'AP. CLAVDIVS CAECVS', secunda: 'L. VOLVMNIVS FLAMMA VIOLENS', jdnstr: 1609651, jdnend: 1610016 },
        { prima: 'Q. MARCIVS TREMVLVS', secunda: 'P. CORNELIVS ARVINA', jdnstr: 1610016, jdnend: 1610381 },
        { prima: 'L. POSTVMIVS MEGELLVS', secunda: 'TI. MINVCIVS AVGVRINVS', jdnstr: 1610381, jdnend: 1610747 },
        { prima: 'P. SEMPRONIVS SOPHVS', secunda: 'P. SVLPICIVS SAVERRIVS', jdnstr: 1610747, jdnend: 1611112 },
        { prima: 'SER. CORNELIVS LENTVLVS', secunda: 'L. GENVCIVS AVENTINENSIS', jdnstr: 1611112, jdnend: 1611477 },
        { prima: 'M. LIVIVS DENTER', secunda: 'M. AEMILIVS PAVLLVS', jdnstr: 1611477, jdnend: 1611842 },
        { prima: 'T. FLAVIVS POSTVMIVS TITIANVS', secunda: 'VIRIVS NEPOTIANVS', jdnstr: 1611842, jdnend: 1612208 },
        { prima: 'M. VALERIVS CORVVS', secunda: 'Q. APPVLEIVS PANSA', jdnstr: 1612208, jdnend: 1612573 },
        { prima: 'M. FVLVIVS PAETINVS', secunda: 'T. MANLIVS TORQVATVS', jdnstr: 1612573, jdnend: 1612938 },
        { prima: 'L. CORNELIVS SCIPIO BARBATVS', secunda: 'CN. FVLVIVS MAXIMVS CENTVMALVS', jdnstr: 1612938, jdnend: 1613303 },
        { prima: 'Q. FABIVS MAXIMVS RVLLIANVS', secunda: 'P. DECIVS MVS', jdnstr: 1613303, jdnend: 1613669 },
        { prima: 'L. VOLVMNIVS FLAMMA VIOLENS', secunda: 'AP. CLAVDIVS CAECVS', jdnstr: 1613669, jdnend: 1614034 },
        { prima: 'Q. FABIVS MAXIMVS RVLLIANVS', secunda: 'P. DECIVS MVS', jdnstr: 1614034, jdnend: 1614399 },
        { prima: 'L. POSTVMIVS MEGELLVS', secunda: 'M. ATILIVS REGVLVS', jdnstr: 1614399, jdnend: 1614764 },
        { prima: 'L. PAPIRIVS CVRSOR', secunda: 'SP. CARVILIVS MAXIMVS', jdnstr: 1614764, jdnend: 1615130 },
        { prima: 'Q. FABIVS MAXIMVS GVRGES', secunda: 'D. JVNIVS BRVTVS SCAEVA', jdnstr: 1615130, jdnend: 1615495 },
        { prima: 'L. POSTVMIVS MEGELLVS', secunda: 'C. JVNIVS BVBVLCVS BRVTVS', jdnstr: 1615495, jdnend: 1615860 },
        { prima: 'P. CORNELIVS RVFINVS', secunda: 'M\'. CVRIVS DENTATVS', jdnstr: 1615860, jdnend: 1616225 },
        { prima: 'M. VALERIVS MAXIMVS CORVINVS', secunda: 'Q. CAEDICIVS NOCTVA', jdnstr: 1616225, jdnend: 1616591 },
        { prima: 'Q. MARCIVS TREMVLVS', secunda: 'P. CORNELIVS ARVINA', jdnstr: 1616591, jdnend: 1616956 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'C. NAVTIVS RVTILVS', jdnstr: 1616956, jdnend: 1617321 },
        { prima: 'M. VALERIVS MAXIMVS (POTITVS? CORVINVS III?)', secunda: 'C. AELIVS PAETVS', jdnstr: 1617321, jdnend: 1617686 },
        { prima: 'C. CLAVDIVS CANINA', secunda: 'M. AEMILIVS LEPIDVS', jdnstr: 1617686, jdnend: 1618052 },
        { prima: 'C. SERVILIVS TVCCA', secunda: 'L. CAECILIVS METELLVS DENTER', jdnstr: 1618052, jdnend: 1618417 },
        { prima: 'P. CORNELIVS DOLABELLA', secunda: 'CN. DOMITIVS CALVINVS MAXIMVS', jdnstr: 1618417, jdnend: 1618782 },
        { prima: 'C. FABRICIVS LVSCINVS', secunda: 'Q. AEMILIVS PAPVS', jdnstr: 1618782, jdnend: 1619147 },
        { prima: 'L. AEMILIVS BARBVLA', secunda: 'Q. MARCIVS PHILIPPVS', jdnstr: 1619147, jdnend: 1619513 },
        { prima: 'P. VALERIVS LAEVINVS', secunda: 'TI. CORVNCANIVS', jdnstr: 1619513, jdnend: 1619878 },
        { prima: 'P. SVLPICIVS SAVERRIO', secunda: 'P. DECIVS MVS', jdnstr: 1619878, jdnend: 1620243 },
        { prima: 'C. FABRICIVS LVSCINVS', secunda: 'Q. AEMILIVS PAPVS', jdnstr: 1620243, jdnend: 1620608 },
        { prima: 'P. CORNELIVS RVFINVS', secunda: 'C. JVNIVS BVBVLCVS BRVTVS', jdnstr: 1620608, jdnend: 1620974 },
        { prima: 'Q. FABIVS MAXIMVS GVRGES', secunda: 'C. GENVCIVS CLEPSINA', jdnstr: 1620974, jdnend: 1621339 },
        { prima: 'M\'. CVRIVS DENTATVS', secunda: 'L. CORNELIVS LENTVLVS CAVDINVS', jdnstr: 1621339, jdnend: 1621704 },
        { prima: 'M\'. CVRIVS DENTATVS', secunda: 'SER. CORNELIVS MERENDA', jdnstr: 1621704, jdnend: 1622069 },
        { prima: 'C. FABIVS LICINVS', secunda: 'C. CLAVDIVS CANINA', jdnstr: 1622069, jdnend: 1622435 },
        { prima: 'L. PAPIRIVS CVRSOR', secunda: 'SP. CARVILIVS MAXIMVS', jdnstr: 1622435, jdnend: 1622800 },
        { prima: 'C. QVINCTIVS CLAVDVS', secunda: 'L. GENVCIVS CLEPSINA', jdnstr: 1622800, jdnend: 1623165 },
        { prima: 'C. GENVCIVS CLEPSINA', secunda: 'CN. CORNELIVS BLASIO', jdnstr: 1623165, jdnend: 1623530 },
        { prima: 'Q. OGVLNIVS GALLVS', secunda: 'C. FABIVS PICTOR', jdnstr: 1623530, jdnend: 1623896 },
        { prima: 'P. SEMPRONIVS SOPHVS', secunda: 'AP. CLAVDIVS RVSSVS', jdnstr: 1623896, jdnend: 1624261 },
        { prima: 'M. ATILIVS REGVLVS', secunda: 'L. JVLIVS LIBO', jdnstr: 1624261, jdnend: 1624626 },
        { prima: 'D. JVNIVS PERA', secunda: 'N. FABIVS PICTOR', jdnstr: 1624626, jdnend: 1624991 },
        { prima: 'Q. FABIVS MAXIMVS GVRGES', secunda: 'L. MAMILIVS VITVLVS', jdnstr: 1624991, jdnend: 1625357 },
        { prima: 'AP. CLAVDIVS CAVDEX', secunda: 'M. FVLVIVS FLACCVS', jdnstr: 1625357, jdnend: 1625722 },
        { prima: 'M\'. VALERIVS MAXIMVS MESALLA', secunda: 'M\'. OTACILIVS CRASSVS', jdnstr: 1625722, jdnend: 1626087 },
        { prima: 'L. POSTVMIVS MEGELLVS', secunda: 'Q. MAMILIVS VITVLVS', jdnstr: 1626087, jdnend: 1626452 },
        { prima: 'L. VALERIVS FLACCVS', secunda: 'T. OTACILIVS CRASSVS', jdnstr: 1626452, jdnend: 1626818 },
        { prima: 'CN. CORNELIVS SCIPIO ASINA', secunda: 'C. DVILIVS', jdnstr: 1626818, jdnend: 1627183 },
        { prima: 'L. CORNELIVS SCIPIO', secunda: 'C. AQVILLIVS FLORVS', jdnstr: 1627183, jdnend: 1627548 },
        { prima: 'A. ATILIVS CAIATINVS', secunda: 'C. SVLPICIVS PATERCVLVS', jdnstr: 1627548, jdnend: 1627913 },
        { prima: 'C. ATILIVS REGVLVS', secunda: 'CN. CORNELIVS BLASIO', jdnstr: 1627913, jdnend: 1628279 },
        { prima: 'L. MANLIVS VVLSO LONGVS', secunda: 'Q. CAEDICIVS', jdnstr: 1628279, jdnend: 1628644 },
        { prima: 'SER. FVLVIVS PAETINVS NOBILIOR', secunda: 'M. AEMILIVS PAVLLVS', jdnstr: 1628644, jdnend: 1629009 },
        { prima: 'CN. CORNELIVS SCIPIO ASINA', secunda: 'A. ATILIVS CAIATINVS', jdnstr: 1629009, jdnend: 1629374 },
        { prima: 'CN. SERVILIVS CAEPIO', secunda: 'C. SEMPRONIVS BLAESVS', jdnstr: 1629374, jdnend: 1629740 },
        { prima: 'C. AVRELIVS COTTA', secunda: 'P. SERVILIVS GEMINVS', jdnstr: 1629740, jdnend: 1630105 },
        { prima: 'L. CAECILIVS METELLVS', secunda: 'C. FVRIVS PACILVS', jdnstr: 1630105, jdnend: 1630470 },
        { prima: 'C. ATILIVS REGVLVS', secunda: 'L. MANLIVS VVLSO LONGVS', jdnstr: 1630470, jdnend: 1630835 },
        { prima: 'P. CLAVDIVS PVLCHER', secunda: 'L. JVNIVS PVLLVS', jdnstr: 1630835, jdnend: 1631201 },
        { prima: 'C. AVRELIVS COTTA', secunda: 'P. SERVILIVS GEMINVS', jdnstr: 1631201, jdnend: 1631566 },
        { prima: 'L. CAECILIVS METELLVS', secunda: 'N. FABIVS BVTEO', jdnstr: 1631566, jdnend: 1631931 },
        { prima: 'M\'. OTACILIVS CRASSVS', secunda: 'M. FABIVS LICINVS', jdnstr: 1631931, jdnend: 1632296 },
        { prima: 'M. FABIVS BVTEO', secunda: 'C. ATILIVS BVLBVS', jdnstr: 1632296, jdnend: 1632662 },
        { prima: 'A. MANLIVS TORQVATVS ATTICVS', secunda: 'C. SEMPRONIVS BLAESVS', jdnstr: 1632662, jdnend: 1633027 },
        { prima: 'C. FVNDANIVS FVNDVLVS', secunda: 'C. SVLPICIVS GALVS', jdnstr: 1633027, jdnend: 1633392 },
        { prima: 'C. LVTATIVS CATVLVS', secunda: 'A. POSTVMIVS ALBINVS', jdnstr: 1633392, jdnend: 1633757 },
        { prima: 'A. MANLIVS TORQVATVS ATTICVS', secunda: 'Q. LVTATIVS CERCO', jdnstr: 1633757, jdnend: 1634123 },
        { prima: 'C. CLAVDIVS CENTHO', secunda: 'M. SEMPRONIVS TVDITANVS', jdnstr: 1634123, jdnend: 1634488 },
        { prima: 'C. MAMILIVS TVRRINVS', secunda: 'Q. VALERIVS FALTO', jdnstr: 1634488, jdnend: 1634853 },
        { prima: 'TI. SEMPRONIVS GRACCHVS', secunda: 'P. VALERIVS FALTO', jdnstr: 1634853, jdnend: 1635218 },
        { prima: 'L. CORNELIVS LENTVLVS CAVDINVS', secunda: 'Q. FVLVIVS FLACCVS', jdnstr: 1635218, jdnend: 1635584 },
        { prima: 'P. CORNELIVS LENTVLVS CAVDINVS', secunda: 'C. LICINIVS VARVS', jdnstr: 1635584, jdnend: 1635949 },
        { prima: 'T. MANLIVS TORQVATVS', secunda: 'C. ATILIVS BVLBVS', jdnstr: 1635949, jdnend: 1636314 },
        { prima: 'L. POSTVMIVS ALBINVS', secunda: 'SP. CARVILIVS MAXIMVS RVGA', jdnstr: 1636314, jdnend: 1636679 },
        { prima: 'Q. FABIVS MAXIMVS VERRVCOSVS', secunda: 'M\'. POMPONIVS MATHO', jdnstr: 1636679, jdnend: 1637045 },
        { prima: 'M. AEMILIVS LEPIDVS', secunda: 'M. PVBLICIVS MALLEOLVS', jdnstr: 1637045, jdnend: 1637410 },
        { prima: 'M. POMPONIVS MATHO', secunda: 'C. PAPIRIVS MASO', jdnstr: 1637410, jdnend: 1637775 },
        { prima: 'M. AEMILIVS BARBVLA', secunda: 'M. JVNIVS PERA', jdnstr: 1637775, jdnend: 1638140 },
        { prima: 'L. POSTVMIVS ALBINVS', secunda: 'CN. FVLVIVS CENTVMALVS', jdnstr: 1638140, jdnend: 1638506 },
        { prima: 'SP. CARVILIVS MAXIMVS RVGA', secunda: 'Q. FABIVS MAXIMVS VERRVCOSVS', jdnstr: 1638506, jdnend: 1638871 },
        { prima: 'P. VALERIVS FLACCVS', secunda: 'M. ATILIVS REGVLVS', jdnstr: 1638871, jdnend: 1639236 },
        { prima: 'M. VALERIVS MESSALLA', secunda: 'L. APVSTIVS FVLLO', jdnstr: 1639236, jdnend: 1639601 },
        { prima: 'L. AEMILIVS PAPVS', secunda: 'C. ATILIVS REGVLVS', jdnstr: 1639601, jdnend: 1639967 },
        { prima: 'T. MANLIVS TORQVATVS', secunda: 'Q. FVLVIVS FLACCVS', jdnstr: 1639967, jdnend: 1640332 },
        { prima: 'C. FLAMINIVS', secunda: 'P. FVRIVS PHILVS', jdnstr: 1640332, jdnend: 1640697 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'CN. CORNELIVS SCIPIO CALVVS', jdnstr: 1640697, jdnend: 1641062 },
        { prima: 'P. CORNELIVS SCIPIO ASINA', secunda: 'M. MINVCIVS RVFVS', jdnstr: 1641062, jdnend: 1641428 },
        { prima: 'M. VALERIVS LAEVINVS (INVALIDATED)', secunda: 'Q. MVCIVS SCAEVOLA (INVALIDATED)', jdnstr: 1641428, jdnend: 1641793 },
        { prima: 'L. AEMILIVS PAVLLVS', secunda: 'M. LIVIVS SALINATOR', jdnstr: 1641793, jdnend: 1642158 },
        { prima: 'P. CORNELIVS SCIPIO', secunda: 'TI. SEMPRONIVS LONGVS', jdnstr: 1642158, jdnend: 1642523 },
        { prima: 'CN. SERVILIVS GEMINVS', secunda: 'C. FLAMINIVS', jdnstr: 1642523, jdnend: 1642889 },
        { prima: 'C. TERENTIVS VARRO', secunda: 'L. AEMILIVS PAVLLVS', jdnstr: 1642889, jdnend: 1643254 },
        { prima: 'L. POSTVMIVS ALBINVS III (KILLED BEFORE TAKING OFFICE)', secunda: 'TI. SEMPRONIVS GRACCHVS', jdnstr: 1643254, jdnend: 1643619 },
        { prima: 'Q. FABIVS MAXIMVS VERRVCOSVS', secunda: 'M. CLAVDIVS MARCELLVS', jdnstr: 1643619, jdnend: 1643984 },
        { prima: 'Q. FABIVS MAXIMVS', secunda: 'TI. SEMPRONIVS GRACCHVS', jdnstr: 1643984, jdnend: 1644350 },
        { prima: 'Q. FVLVIVS FLACCVS', secunda: 'AP. CLAVDIVS PVLCHER', jdnstr: 1644350, jdnend: 1644715 },
        { prima: 'CN. FVLVIVS CENTVMALVS MAXIMVS', secunda: 'P. SVLPICIVS GALBA MAXIMVS', jdnstr: 1644715, jdnend: 1645080 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'M. VALERIVS LAEVINVS', jdnstr: 1645080, jdnend: 1645445 },
        { prima: 'Q. FABIVS MAXIMVS VERRVCOSVS', secunda: 'Q. FVLVIVS FLACCVS', jdnstr: 1645445, jdnend: 1645811 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'T. QVINCTIVS CRISPINVS', jdnstr: 1645811, jdnend: 1646176 },
        { prima: 'C. CLAVDIVS NERO', secunda: 'M. LIVIVS SALINATOR', jdnstr: 1646176, jdnend: 1646541 },
        { prima: 'L. VETVRIVS PHILO', secunda: 'Q. CAECILIVS METELLVS', jdnstr: 1646541, jdnend: 1646906 },
        { prima: 'P. CORNELIVS SCIPIO (AFRICANVS)', secunda: 'P. LICINIVS CRASSVS DIVES', jdnstr: 1646906, jdnend: 1647272 },
        { prima: 'M. CORNELIVS CETHEGVS', secunda: 'P. SEMPRONIVS TVDITANVS', jdnstr: 1647272, jdnend: 1647637 },
        { prima: 'CN. SERVILIVS CAEPIO', secunda: 'C. SERVILIVS GEMINVS', jdnstr: 1647637, jdnend: 1648002 },
        { prima: 'M. SERVILIVS PVLEX GEMINVS', secunda: 'TI. CLAVDIVS NERO', jdnstr: 1648002, jdnend: 1648367 },
        { prima: 'CN. CORNELIVS LENTVLVS', secunda: 'P. AELIVS PAETVS', jdnstr: 1648367, jdnend: 1648733 },
        { prima: 'P. SVLPICIVS GALBA MAXIMVS', secunda: 'C. AVRELIVS COTTA', jdnstr: 1648733, jdnend: 1649098 },
        { prima: 'L. CORNELIVS LENTVLVS', secunda: 'P. VILLIVS TAPPVLVS', jdnstr: 1649098, jdnend: 1649463 },
        { prima: 'T. QVINCTIVS FLAMININVS', secunda: 'SEX. AELIVS PAETVS CATVS', jdnstr: 1649463, jdnend: 1649828 },
        { prima: 'C. CORNELIVS CETHEGVS', secunda: 'Q. MINVCIVS RVFVS', jdnstr: 1649828, jdnend: 1650194 },
        { prima: 'L. FVRIVS PVRPVREO', secunda: 'M. CLAVDIVS MARCELLVS', jdnstr: 1650194, jdnend: 1650559 },
        { prima: 'L. VALERIVS FLACCVS', secunda: 'M. PORCIVS CATO', jdnstr: 1650559, jdnend: 1650924 },
        { prima: 'P. CORNELIVS SCIPIO AFRICANVS', secunda: 'TI. SEMPRONIVS LONGVS', jdnstr: 1650924, jdnend: 1651289 },
        { prima: 'L. CORNELIVS MERVLA', secunda: 'Q. MINVCIVS THERMVS', jdnstr: 1651289, jdnend: 1651655 },
        { prima: 'L. QVINCTIVS FLAMININVS', secunda: 'CN. DOMITIVS AHENOBARBVS', jdnstr: 1651655, jdnend: 1652020 },
        { prima: 'P. CORNELIVS SCIPIO NASICA', secunda: 'M\'. ACILIVS GLABRIO', jdnstr: 1652020, jdnend: 1652385 },
        { prima: 'L. CORNELIVS SCIPIO ASIATICVS', secunda: 'C. LAELIVS', jdnstr: 1652385, jdnend: 1652750 },
        { prima: 'M. FVLVIVS NOBILIOR', secunda: 'CN. MANLIVS VVLSO', jdnstr: 1652750, jdnend: 1653116 },
        { prima: 'M. VALERIVS MESSALLA', secunda: 'C. LIVIVS SALINATOR', jdnstr: 1653116, jdnend: 1653481 },
        { prima: 'M. AEMILIVS LEPIDVS', secunda: 'C. FLAMINIVS', jdnstr: 1653481, jdnend: 1653846 },
        { prima: 'SP. POSTVMIVS ALBINVS', secunda: 'Q. MARCIVS PHILIPPVS', jdnstr: 1653846, jdnend: 1654211 },
        { prima: 'AP. CLAVDIVS PVLCHER', secunda: 'M. SEMPRONIVS TVDITANVS', jdnstr: 1654211, jdnend: 1654577 },
        { prima: 'P. CLAVDIVS PVLCHER', secunda: 'L. PORCIVS LICINVS', jdnstr: 1654577, jdnend: 1654942 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'Q. FABIVS LABEO', jdnstr: 1654942, jdnend: 1655307 },
        { prima: 'CN. BAEBIVS TAMPHILVS', secunda: 'L. AEMILIVS PAVLLVS (MACEDONICVS)', jdnstr: 1655307, jdnend: 1655672 },
        { prima: 'P. CORNELIVS CETHEGVS', secunda: 'M. BAEBIVS TAMPHILVS', jdnstr: 1655672, jdnend: 1656038 },
        { prima: 'A. POSTVMIVS ALBINVS LVSCVS', secunda: 'C. CALPVRNIVS PISO', jdnstr: 1656038, jdnend: 1656403 },
        { prima: 'Q. FVLVIVS FLACCVS', secunda: 'L. MANLIVS ACIDINVS FVLVIANVS', jdnstr: 1656403, jdnend: 1656768 },
        { prima: 'M. JVNIVS BRVTVS', secunda: 'A. MANLIVS VVLSO', jdnstr: 1656768, jdnend: 1657133 },
        { prima: 'C. CLAVDIVS PVLCHER', secunda: 'TI. SEMPRONIVS GRACCHVS', jdnstr: 1657133, jdnend: 1657499 },
        { prima: 'CN. CORNELIVS SCIPIO HISPALLVS', secunda: 'Q. PETILLIVS SPVRINVS', jdnstr: 1657499, jdnend: 1657864 },
        { prima: 'P. MVCIVS SCAEVOLA', secunda: 'M. AEMILIVS LEPIDVS', jdnstr: 1657864, jdnend: 1658229 },
        { prima: 'SP. POSTVMIVS ALBINVS PAVLLVLVS', secunda: 'Q. MVCIVS SCAEVOLA', jdnstr: 1658229, jdnend: 1658594 },
        { prima: 'L. POSTVMIVS ALBINVS', secunda: 'M. POPILLIVS LAENAS', jdnstr: 1658594, jdnend: 1658960 },
        { prima: 'C. POPILLIVS LAENAS', secunda: 'P. AELIVS LIGVS', jdnstr: 1658960, jdnend: 1659325 },
        { prima: 'P. LICINIVS CRASSVS', secunda: 'C. CASSIVS LONGINVS', jdnstr: 1659325, jdnend: 1659690 },
        { prima: 'A. HOSTILIVS MANCINVS', secunda: 'A. ATILIVS SERRANVS', jdnstr: 1659690, jdnend: 1660055 },
        { prima: 'Q. MARCIVS PHILIPPVS', secunda: 'CN. SERVILIVS CAEPIO', jdnstr: 1660055, jdnend: 1660421 },
        { prima: 'L. AEMILIVS PAVLLVS MACEDONICVS', secunda: 'C. LICINIVS CRASSVS', jdnstr: 1660421, jdnend: 1660786 },
        { prima: 'Q. AELIVS PAETVS', secunda: 'M. JVNIVS PENNVS', jdnstr: 1660786, jdnend: 1661151 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'C. SVLPICIVS GALVS', jdnstr: 1661151, jdnend: 1661516 },
        { prima: 'T. MANLIVS TORQVATVS', secunda: 'CN. OCTAVIVS', jdnstr: 1661516, jdnend: 1661882 },
        { prima: 'A. MANLIVS TORQVATVS', secunda: 'Q. CASSIVS LONGINVS', jdnstr: 1661882, jdnend: 1662247 },
        { prima: 'TI. SEMPRONIVS GRACCHVS', secunda: 'M\'. JVVENTIVS THALNA', jdnstr: 1662247, jdnend: 1662612 },
        { prima: 'P. CORNELIVS SCIPIO NASICA CORCVLVM', secunda: 'C. MARCIVS FIGVLVS', jdnstr: 1662612, jdnend: 1662977 },
        { prima: 'M. VALERIVS MESSALLA', secunda: 'C. FANNIVS STRABO', jdnstr: 1662977, jdnend: 1663343 },
        { prima: 'L. ANICIVS GALLVS', secunda: 'M. CORNELIVS CETHEGVS', jdnstr: 1663343, jdnend: 1663708 },
        { prima: 'CN. CORNELIVS DOLABELLA', secunda: 'M. FVLVIVS NOBILIOR', jdnstr: 1663708, jdnend: 1664073 },
        { prima: 'M. AEMILIVS LEPIDVS', secunda: 'C. POPILLIVS LAENAS', jdnstr: 1664073, jdnend: 1664438 },
        { prima: 'SEX. JVLIVS CAESAR', secunda: 'L. AVRELIVS ORESTES', jdnstr: 1664438, jdnend: 1664804 },
        { prima: 'L. CORNELIVS LENTVLVS LVPVS', secunda: 'C. MARCIVS FIGVLVS', jdnstr: 1664804, jdnend: 1665169 },
        { prima: 'P. CORNELIVS SCIPIO NASICA CORCVLVM', secunda: 'M. CLAVDIVS MARCELLVS', jdnstr: 1665169, jdnend: 1665534 },
        { prima: 'Q. OPIMIVS', secunda: 'L. POSTVMIVS ALBINVS', jdnstr: 1665534, jdnend: 1665825 },
        { prima: 'Q. FVLVIVS NOBILIOR', secunda: 'T. ANNIVS LVSCVS', jdnstr: 1665825, jdnend: 1666191 },
        { prima: 'M. CLAVDIVS MARCELLVS', secunda: 'L. VALERIVS FLACCVS', jdnstr: 1666191, jdnend: 1666556 },
        { prima: 'L. LICINIVS LVCVLLVS', secunda: 'A. POSTVMIVS ALBINVS', jdnstr: 1666556, jdnend: 1666921 },
        { prima: 'T. QVINCTIVS FLAMININVS', secunda: 'M\'. ACILIVS BALBVS', jdnstr: 1666921, jdnend: 1667286 },
        { prima: 'L. MARCIVS CENSORINVS', secunda: 'M\'. MANILIVS', jdnstr: 1667286, jdnend: 1667652 },
        { prima: 'SP. POSTVMIVS ALBINVS MAGNVS', secunda: 'L. CALPVRNIVS PISO CAESONINVS', jdnstr: 1667652, jdnend: 1668017 },
        { prima: 'P. CORNELIVS SCIPIO AEMILIANVS', secunda: 'C. LIVIVS DRVSVS', jdnstr: 1668017, jdnend: 1668382 },
        { prima: 'CN. CORNELIVS LENTVLVS', secunda: 'L. MVMMIVS ACHAICVS', jdnstr: 1668382, jdnend: 1668747 },
        { prima: 'Q. FABIVS MAXIMVS AEMILIANVS', secunda: 'L. HOSTILIVS MANCINVS', jdnstr: 1668747, jdnend: 1669113 },
        { prima: 'SER. SVLPICIVS GALBA', secunda: 'L. AVRELIVS COTTA', jdnstr: 1669113, jdnend: 1669478 },
        { prima: 'AP. CLAVDIVS PVLCHER', secunda: 'Q. CAECILIVS METELLVS MACEDONICVS', jdnstr: 1669478, jdnend: 1669843 },
        { prima: 'L. CAECILIVS METELLVS CALVVS', secunda: 'Q. FABIVS MAXIMVS SERVILIANVS', jdnstr: 1669843, jdnend: 1670208 },
        { prima: 'CN. SERVILIVS CAEPIO', secunda: 'Q. POMPEIVS', jdnstr: 1670208, jdnend: 1670574 },
        { prima: 'C. LAELIVS SAPIENS', secunda: 'Q. SERVILIVS CAEPIO', jdnstr: 1670574, jdnend: 1670939 },
        { prima: 'CN. CALPVRNIVS PISO', secunda: 'M. POPILLIVS LAENAS', jdnstr: 1670939, jdnend: 1671304 },
        { prima: 'P. CORNELIVS SCIPIO NASICA SERAPIO', secunda: 'D. JVNIVS BRVTVS (CALLAICVS)', jdnstr: 1671304, jdnend: 1671669 },
        { prima: 'M. AEMILIVS LEPIDVS PORCINA', secunda: 'C. HOSTILIVS MANCINVS', jdnstr: 1671669, jdnend: 1672035 },
        { prima: 'L. FVRIVS PHILVS', secunda: 'SEX. ATILIVS SERRANVS', jdnstr: 1672035, jdnend: 1672400 },
        { prima: 'SER. FVLVIVS FLACCVS', secunda: 'Q. CALPVRNIVS PISO', jdnstr: 1672400, jdnend: 1672765 },
        { prima: 'P. CORNELIVS SCIPIO AFRICANVS AEMILIANVS', secunda: 'C. FVLVIVS FLACCVS', jdnstr: 1672765, jdnend: 1673130 },
        { prima: 'P. MVCIVS SCAEVOLA', secunda: 'L. CALPVRNIVS PISO FRVGI', jdnstr: 1673130, jdnend: 1673496 },
        { prima: 'P. POPILLIVS LAENAS', secunda: 'P. RVPILIVS', jdnstr: 1673496, jdnend: 1673861 },
        { prima: 'P. LICINIVS CRASSVS DIVES MVCIANVS', secunda: 'L. VALERIVS FLACCVS', jdnstr: 1673861, jdnend: 1674226 },
        { prima: 'L. CORNELIVS LENTVLVS', secunda: 'M. PERPERNA', jdnstr: 1674226, jdnend: 1674591 },
        { prima: 'C. SEMPRONIVS TVDITANVS', secunda: 'M\'. AQVILLIVS', jdnstr: 1674591, jdnend: 1674957 },
        { prima: 'CN. OCTAVIVS', secunda: 'T. ANNIVS RVFVS', jdnstr: 1674957, jdnend: 1675322 },
        { prima: 'L. CASSIVS LONGINVS RAVILLA', secunda: 'L. CORNELIVS CINNA', jdnstr: 1675322, jdnend: 1675687 },
        { prima: 'M. AEMILIVS LEPIDVS', secunda: 'L. AVRELIVS ORESTES', jdnstr: 1675687, jdnend: 1676052 },
        { prima: 'M. PLAVTIVS HYPSAEVS', secunda: 'M. FVLVIVS FLACCVS', jdnstr: 1676052, jdnend: 1676418 },
        { prima: 'C. CASSIVS LONGINVS', secunda: 'C. SEXTIVS CALVINVS', jdnstr: 1676418, jdnend: 1676783 },
        { prima: 'Q. CAECILIVS METELLVS (BALEARICVS)', secunda: 'T. QVINCTIVS FLAMININVS', jdnstr: 1676783, jdnend: 1677148 },
        { prima: 'CN. DOMITIVS AHENOBARBVS', secunda: 'C. FANNIVS', jdnstr: 1677148, jdnend: 1677513 },
        { prima: 'L. OPIMIVS', secunda: 'Q. FABIVS MAXIMVS (ALLOBROGICVS)', jdnstr: 1677513, jdnend: 1677879 },
        { prima: 'P. MANILIVS', secunda: 'C. PAPIRIVS CARBO', jdnstr: 1677879, jdnend: 1678244 },
        { prima: 'L. CAECILIVS METELLVS (DELMATICVS)', secunda: 'L. AVRELIVS COTTA', jdnstr: 1678244, jdnend: 1678609 },
        { prima: 'M. PORCIVS CATO', secunda: 'Q. MARCIVS REX', jdnstr: 1678609, jdnend: 1678974 },
        { prima: 'L. CAECILIVS METELLVS DIADEMATVS', secunda: 'Q. MVCIVS SCAEVOLA (AVGVR)', jdnstr: 1678974, jdnend: 1679340 },
        { prima: 'C. LICINIVS GETA', secunda: 'Q. FABIVS MAXIMVS EBVRNVS', jdnstr: 1679340, jdnend: 1679705 },
        { prima: 'M. AEMILIVS SCAVRVS', secunda: 'M. CAECILIVS METELLVS', jdnstr: 1679705, jdnend: 1680070 },
        { prima: 'M\'. ACILIVS BALBVS', secunda: 'C. PORCIVS CATO', jdnstr: 1680070, jdnend: 1680435 },
        { prima: 'C. CAECILIVS METELLVS CAPRARIVS', secunda: 'CN. PAPIRIVS CARBO', jdnstr: 1680435, jdnend: 1680801 },
        { prima: 'M. LIVIVS DRVSVS', secunda: 'L. CALPVRNIVS PISO CAESONINVS', jdnstr: 1680801, jdnend: 1681166 },
        { prima: 'P. CORNELIVS SCIPIO NASICA', secunda: 'L. CALPVRNIVS BESTIA', jdnstr: 1681166, jdnend: 1681531 },
        { prima: 'M. MINVCIVS RVFVS', secunda: 'SP. POSTVMIVS ALBINVS', jdnstr: 1681531, jdnend: 1681896 },
        { prima: 'Q. CAECILIVS METELLVS (NVMIDICVS)', secunda: 'M. JVNIVS SILANVS', jdnstr: 1681896, jdnend: 1682262 },
        { prima: 'SER. SVLPICIVS GALBA', secunda: 'HORTENSIVS (INVALIDATED)', jdnstr: 1682262, jdnend: 1682627 },
        { prima: 'C. MARIVS', secunda: 'L. CASSIVS LONGINVS', jdnstr: 1682627, jdnend: 1682992 },
        { prima: 'Q. SERVILIVS CAEPIO', secunda: 'C. ATILIVS SERRANVS', jdnstr: 1682992, jdnend: 1683357 },
        { prima: 'P. RVTILIVS RVFVS', secunda: 'CN. MALLIVS MAXIMVS', jdnstr: 1683357, jdnend: 1683723 },
        { prima: 'C. MARIVS', secunda: 'C. FLAVIVS FIMBRIA', jdnstr: 1683723, jdnend: 1684088 },
        { prima: 'C. MARIVS', secunda: 'L. AVRELIVS ORESTES', jdnstr: 1684088, jdnend: 1684453 },
        { prima: 'C. MARIVS', secunda: 'Q. LVTATIVS CATVLVS', jdnstr: 1684453, jdnend: 1684818 },
        { prima: 'C. MARIVS', secunda: 'M\'. AQVILLIVS', jdnstr: 1684818, jdnend: 1685184 },
        { prima: 'C. MARIVS', secunda: 'L. VALERIVS FLACCVS', jdnstr: 1685184, jdnend: 1685914 },
        { prima: 'Q. CAECILIVS METELLVS NEPOS', secunda: 'T. DIDIVS', jdnstr: 1685914, jdnend: 1686279 },
        { prima: 'CN. CORNELIVS LENTVLVS', secunda: 'P. LICINIVS CRASSVS', jdnstr: 1686279, jdnend: 1686645 },
        { prima: 'CN. DOMITIVS AHENOBARBVS', secunda: 'C. CASSIVS LONGINVS', jdnstr: 1686645, jdnend: 1687010 },
        { prima: 'L. LICINIVS CRASSVS', secunda: 'Q. MVCIVS SCAEVOLA (PONTIFEX)', jdnstr: 1687010, jdnend: 1687375 },
        { prima: 'C. COELIVS CALDVS', secunda: 'L. DOMITIVS AHENOBARBVS', jdnstr: 1687375, jdnend: 1687740 },
        { prima: 'C. VALERIVS FLACCVS', secunda: 'M. HERENNIVS', jdnstr: 1687740, jdnend: 1688106 },
        { prima: 'C. CLAVDIVS PVLCHER', secunda: 'M. PERPERNA', jdnstr: 1688106, jdnend: 1688471 },
        { prima: 'L. MARCIVS PHILIPPVS', secunda: 'SEX. JVLIVS CAESAR', jdnstr: 1688471, jdnend: 1688836 },
        { prima: 'L. JVLIVS CAESAR', secunda: 'P. RVTILIVS LVPVS', jdnstr: 1688836, jdnend: 1689201 },
        { prima: 'CN. POMPEIVS STRABO', secunda: 'L. PORCIVS CATO', jdnstr: 1689201, jdnend: 1689567 },
        { prima: 'L. CORNELIVS SVLLA', secunda: 'Q. POMPEIVS RVFVS', jdnstr: 1689567, jdnend: 1689932 },
        { prima: 'CN. OCTAVIVS', secunda: 'L. CORNELIVS CINNA', jdnstr: 1689932, jdnend: 1690297 },
        { prima: 'L. CORNELIVS CINNA', secunda: 'C. MARIVS', jdnstr: 1690297, jdnend: 1690662 },
        { prima: 'L. CORNELIVS CINNA', secunda: 'CN. PAPIRIVS CARBO', jdnstr: 1690662, jdnend: 1691028 },
        { prima: 'CN. PAPIRIVS CARBO', secunda: 'L. CORNELIVS CINNA', jdnstr: 1691028, jdnend: 1691393 },
        { prima: 'L. CORNELIVS SCIPIO ASIAGENES (ASIATICVS)', secunda: 'C. NORBANVS', jdnstr: 1691393, jdnend: 1691758 },
        { prima: 'C. MARIVS', secunda: 'CN. PAPIRIVS CARBO', jdnstr: 1691758, jdnend: 1692123 },
        { prima: 'M. TVLLIVS DECVLA', secunda: 'CN. CORNELIVS DOLABELLA', jdnstr: 1692123, jdnend: 1692489 },
        { prima: 'L. CORNELIVS SVLLA FELIX', secunda: 'Q. CAECILIVS METELLVS PIVS', jdnstr: 1692489, jdnend: 1692854 },
        { prima: 'P. SERVILIVS VATIA (ISAVRICVS)', secunda: 'AP. CLAVDIVS PVLCHER', jdnstr: 1692854, jdnend: 1693219 },
        { prima: 'M. AEMILIVS LEPIDVS', secunda: 'Q. LVTATIVS CATVLVS', jdnstr: 1693219, jdnend: 1693584 },
        { prima: 'D. JVNIVS BRVTVS', secunda: 'MAM. AEMILIVS LEPIDVS LIVIANVS', jdnstr: 1693584, jdnend: 1693950 },
        { prima: 'CN. OCTAVIVS', secunda: 'C. SCRIBONIVS CVRIO', jdnstr: 1693950, jdnend: 1694315 },
        { prima: 'L. OCTAVIVS', secunda: 'C. AVRELIVS COTTA', jdnstr: 1694315, jdnend: 1694680 },
        { prima: 'L. LICINIVS LVCVLLVS', secunda: 'M. AVRELIVS COTTA', jdnstr: 1694680, jdnend: 1695045 },
        { prima: 'M. TERENTIVS VARRO LVCVLLVS', secunda: 'C. CASSIVS LONGINVS', jdnstr: 1695045, jdnend: 1695411 },
        { prima: 'L. GELLIVS', secunda: 'CN. CORNELIVS LENTVLVS CLODIANVS', jdnstr: 1695411, jdnend: 1695776 },
        { prima: 'P. CORNELIVS LENTVLVS SVRA', secunda: 'CN. AVFIDIVS ORESTES', jdnstr: 1695776, jdnend: 1696141 },
        { prima: 'CN. POMPEIVS MAGNVS', secunda: 'M. LICINIVS CRASSVS', jdnstr: 1696141, jdnend: 1696506 },
        { prima: 'Q. HORTENSIVS HORTALVS', secunda: 'Q. CAECILIVS METELLVS (CRETICVS)', jdnstr: 1696506, jdnend: 1696872 },
        { prima: 'L. CAECILIVS METELLVS', secunda: 'Q. MARCIVS REX', jdnstr: 1696872, jdnend: 1697237 },
        { prima: 'C. CALPVRNIVS PISO', secunda: 'M\'. ACILIVS GLABRIO', jdnstr: 1697237, jdnend: 1697602 },
        { prima: 'M\'. AEMILIVS LEPIDVS', secunda: 'L. VOLCACIVS TVLLVS', jdnstr: 1697602, jdnend: 1697967 },
        { prima: 'P. CORNELIVS SVLLA (INVALIDATED)', secunda: 'P. AVTRONIVS PAETVS (INVALIDATED)', jdnstr: 1697967, jdnend: 1698333 },
        { prima: 'L. JVLIVS CAESAR', secunda: '(?) MINVCIVS THERMVS', jdnstr: 1698333, jdnend: 1698698 },
        { prima: 'M. TVLLIVS CICERO', secunda: 'C. ANTONIVS HYBRIDA', jdnstr: 1698698, jdnend: 1699063 },
        { prima: 'D. JVNIVS SILANVS', secunda: 'L. LICINIVS MVRENA', jdnstr: 1699063, jdnend: 1699428 },
        { prima: 'M. PVPIVS PISO FRVGI CALPVRNIANVS', secunda: 'M. VALERIVS MESSALLA NIGER', jdnstr: 1699428, jdnend: 1699794 },
        { prima: 'NERO CLAVDIVS CAESAR AVGVSTVS GERMANICVS', secunda: 'COSSVS CORNELIVS LENTVLVS', jdnstr: 1699794, jdnend: 1700159 },
        { prima: 'C. JVLIVS CAESAR', secunda: 'M. CALPVRNIVS BIBVLVS', jdnstr: 1700159, jdnend: 1700524 },
        { prima: 'L. CALPVRNIVS PISO CAESONINVS', secunda: 'A. GABINIVS', jdnstr: 1700524, jdnend: 1700889 },
        { prima: 'P. CORNELIVS LENTVLVS SPINTHER', secunda: 'Q. CAECILIVS METELLVS NEPOS', jdnstr: 1700889, jdnend: 1701255 },
        { prima: 'CN. CORNELIVS LENTVLVS MARCELLINVS', secunda: 'L. MARCIVS PHILIPPVS', jdnstr: 1701255, jdnend: 1701620 },
        { prima: 'CN. POMPEIVS MAGNVS', secunda: 'M. LICINIVS CRASSVS', jdnstr: 1701620, jdnend: 1701985 },
        { prima: 'L. DOMITIVS AHENOBARBVS', secunda: 'AP. CLAVDIVS PVLCHER', jdnstr: 1701985, jdnend: 1702350 },
        { prima: 'CN. DOMITIVS CALVINVS', secunda: 'M. VALERIVS MESSALLA RVFVS', jdnstr: 1702350, jdnend: 1702716 },
        { prima: 'CN. POMPEIVS MAGNVS', secunda: 'Q. CAECILIVS METELLVS PIVS SCIPIO (FROM 1 SEPTEMBER)', jdnstr: 1702716, jdnend: 1703081 },
        { prima: 'SER. SVLPICIVS RVFVS', secunda: 'M. CLAVDIVS MARCELLVS', jdnstr: 1703081, jdnend: 1703446 },
        { prima: 'L. AEMILIVS PAVLLVS', secunda: 'C. CLAVDIVS MARCELLVS', jdnstr: 1703446, jdnend: 1703811 },
        { prima: 'C. CLAVDIVS MARCELLVS', secunda: 'L. CORNELIVS LENTVLVS CRVS', jdnstr: 1703811, jdnend: 1704177 },
        { prima: 'C. JVLIVS CAESAR', secunda: 'P. SERVILIVS ISAVRICVS', jdnstr: 1704177, jdnend: 1704542 },
        { prima: 'Q. FVFIVS CALENVS', secunda: 'P. VATINIVS', jdnstr: 1704542, jdnend: 1704987 },
        { prima: 'C. JVLIVS CAESAR', secunda: 'M. AEMILIVS LEPIDVS', jdnstr: 1704987, jdnend: 1705353 },
        { prima: 'C. JVLIVS CAESAR', secunda: 'SINE COLLEGA', jdnstr: 1705353, jdnend: 1705718 },
        { prima: 'C. JVLIVS CAESAR', secunda: 'M. ANTONIVS', jdnstr: 1705718, jdnend: 1705762 },
        { prima: 'IVLIVS CAESAR', secunda: '', jdnstr: 1705762, jdnend: 1705791 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1705791, jdnend: 1706413 },
        { prima: 'OCTAVIANVS', secunda: 'M ANTONIVS WITH KLEOPATRA VII PHILOPATOR & M LEPIDVS', jdnstr: 1706413, jdnend: 1710100 },
        { prima: 'OCTAVIANVS', secunda: 'M ANTONIVS WITH KLEOPATRA VII PHILOPATOR', jdnstr: 1710100, jdnend: 1711942 },
        { prima: 'AVGVSTVS', secunda: '', jdnstr: 1711942, jdnend: 1726402 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1726402, jdnend: 1726431 },
        { prima: 'TIBERIVS', secunda: '', jdnstr: 1726431, jdnend: 1734647 },
        { prima: 'GAIVS CAESAR', secunda: '', jdnstr: 1734647, jdnend: 1736057 },
        { prima: 'CLAVDIVS', secunda: '', jdnstr: 1736057, jdnend: 1736057 },
        { prima: 'TOGODVMNVS', secunda: 'CARATACVS', jdnstr: 1736057, jdnend: 1736976 },
        { prima: 'CLAVDIVS', secunda: '', jdnstr: 1736976, jdnend: 1741067 },
        { prima: 'NERO', secunda: '', jdnstr: 1741067, jdnend: 1746054 },
        { prima: 'GALBA', secunda: '', jdnstr: 1746054, jdnend: 1746275 },
        { prima: 'OTHO', secunda: '', jdnstr: 1746275, jdnend: 1746366 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1746366, jdnend: 1746369 },
        { prima: 'VITELLIVS', secunda: '', jdnstr: 1746369, jdnend: 1746614 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1746614, jdnend: 1746615 },
        { prima: 'VESPASIANVS', secunda: '', jdnstr: 1746615, jdnend: 1750086 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1750086, jdnend: 1750087 },
        { prima: 'TITVS', secunda: '', jdnstr: 1750087, jdnend: 1750899 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1750899, jdnend: 1750900 },
        { prima: 'DOMITIANVS', secunda: '', jdnstr: 1750900, jdnend: 1756383 },
        { prima: 'NERVA', secunda: '', jdnstr: 1756383, jdnend: 1756879 },
        { prima: 'TRAIANVS', secunda: '', jdnstr: 1756879, jdnend: 1764012 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1764012, jdnend: 1764015 },
        { prima: 'HADRIANVS', secunda: '', jdnstr: 1764015, jdnend: 1771653 },
        { prima: 'ANTONINVS PIVS', secunda: '', jdnstr: 1771653, jdnend: 1779929 },
        { prima: 'MARCVS AVRELIVS', secunda: 'LVCIVS VERVS', jdnstr: 1779929, jdnend: 1782808 },
        { prima: 'MARCVS AVRELIVS', secunda: '', jdnstr: 1782808, jdnend: 1785708 },
        { prima: 'MARCVS AVRELIVS', secunda: 'COMMODVS', jdnstr: 1785708, jdnend: 1786879 },
        { prima: 'COMMODVS', secunda: '', jdnstr: 1786879, jdnend: 1791551 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1791551, jdnend: 1791552 },
        { prima: 'PERTINAX', secunda: '', jdnstr: 1791552, jdnend: 1791638 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1791638, jdnend: 1791642 },
        { prima: 'CLODIVS ALBINVS', secunda: '', jdnstr: 1791642, jdnend: 1793062 },
        { prima: 'SEPTIMIVS SEVERVS', secunda: '', jdnstr: 1793062, jdnend: 1793405 },
        { prima: 'SEPTIMIVS SEVERVS', secunda: 'CARACALLA', jdnstr: 1793405, jdnend: 1797396 },
        { prima: 'SEPTIMIVS SEVERVS', secunda: 'CARACALLA & GETA', jdnstr: 1797396, jdnend: 1798160 },
        { prima: 'CARACALLA', secunda: 'GETA', jdnstr: 1798160, jdnend: 1798478 },
        { prima: 'CARACALLA', secunda: '', jdnstr: 1798478, jdnend: 1800415 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1800415, jdnend: 1800418 },
        { prima: 'MACRINVS', secunda: 'DIADVMENIANVS', jdnstr: 1800418, jdnend: 1800841 },
        { prima: 'ELAGABALVS', secunda: '', jdnstr: 1800841, jdnend: 1802213 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1802213, jdnend: 1802215 },
        { prima: 'SEVERVS ALEXANDER', secunda: '', jdnstr: 1802215, jdnend: 1806970 },
        { prima: 'MAXIMINVS THRAX', secunda: '', jdnstr: 1806970, jdnend: 1808068 },
        { prima: 'GORDIANVS I', secunda: '', jdnstr: 1808068, jdnend: 1808089 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1808089, jdnend: 1808099 },
        { prima: 'PVPIENVS', secunda: 'BALBINVS', jdnstr: 1808099, jdnend: 1808197 },
        { prima: 'GORDIANVS III', secunda: '', jdnstr: 1808197, jdnend: 1810210 },
        { prima: 'PHILIPPVS', secunda: '', jdnstr: 1810210, jdnend: 1812249 },
        { prima: 'DECIVS', secunda: '', jdnstr: 1812249, jdnend: 1812887 },
        { prima: 'TREBONIANVS GALLVS', secunda: '', jdnstr: 1812887, jdnend: 1813679 },
        { prima: 'AEMILIANVS', secunda: '', jdnstr: 1813679, jdnend: 1813761 },
        { prima: 'VALERIANVS', secunda: 'GALLIENVS', jdnstr: 1813761, jdnend: 1816205 },
        { prima: 'POSTVMVS', secunda: '', jdnstr: 1816205, jdnend: 1819342 },
        { prima: 'LAELIANVS', secunda: '', jdnstr: 1819342, jdnend: 1819462 },
        { prima: 'MARIVS', secunda: '', jdnstr: 1819462, jdnend: 1819554 },
        { prima: 'VICTORINVS', secunda: '', jdnstr: 1819554, jdnend: 1820041 },
        { prima: 'TETRICVS I', secunda: '', jdnstr: 1820041, jdnend: 1821196 },
        { prima: 'AVRELIANVS', secunda: '', jdnstr: 1821196, jdnend: 1821769 },
        { prima: 'TACITVS', secunda: '', jdnstr: 1821769, jdnend: 1822019 },
        { prima: 'FLORIANVS', secunda: '', jdnstr: 1822019, jdnend: 1822111 },
        { prima: 'PROBVS', secunda: '', jdnstr: 1822111, jdnend: 1824302 },
        { prima: 'CARVS', secunda: '', jdnstr: 1824302, jdnend: 1824605 },
        { prima: 'CARINVS', secunda: '', jdnstr: 1824605, jdnend: 1825336 },
        { prima: 'DIOCLETIANVS', secunda: '', jdnstr: 1825336, jdnend: 1825356 },
        { prima: 'MAXIMIANVS', secunda: '', jdnstr: 1825356, jdnend: 1825520 },
        { prima: 'CARAVSIVS', secunda: '', jdnstr: 1825520, jdnend: 1828077 },
        { prima: 'ALLECTVS', secunda: '', jdnstr: 1828077, jdnend: 1829172 },
        { prima: 'CONSTANTIVS I', secunda: '', jdnstr: 1829172, jdnend: 1833030 },
        { prima: 'CONSTANTINVS I', secunda: '', jdnstr: 1833030, jdnend: 1844289 },
        { prima: 'CONSTANS', secunda: '', jdnstr: 1844289, jdnend: 1848913 },
        { prima: 'MAGNENTIVS', secunda: '', jdnstr: 1848913, jdnend: 1850213 },
        { prima: 'CONSTANTIVS II', secunda: '', jdnstr: 1850213, jdnend: 1852579 },
        { prima: 'IVLIANVS', secunda: '', jdnstr: 1852579, jdnend: 1853820 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1853820, jdnend: 1853821 },
        { prima: 'IOVIANVS', secunda: '', jdnstr: 1853821, jdnend: 1854056 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1854056, jdnend: 1854065 },
        { prima: 'VALENTINIANVS I', secunda: '', jdnstr: 1854065, jdnend: 1855340 },
        { prima: 'GRATIANVS', secunda: '', jdnstr: 1855340, jdnend: 1861185 },
        { prima: 'MAGNVS MAXIMVS', secunda: '', jdnstr: 1861185, jdnend: 1863015 },
        { prima: 'VALENTINIANVS II', secunda: '', jdnstr: 1863015, jdnend: 1864371 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1864371, jdnend: 1864470 },
        { prima: 'EVGENIVS', secunda: '', jdnstr: 1864470, jdnend: 1865215 },
        { prima: 'THEODOSIVS I', secunda: '', jdnstr: 1865215, jdnend: 1865348 },
        { prima: 'HONORIVS', secunda: '', jdnstr: 1865348, jdnend: 1869501 },
        { prima: 'MARCVS', secunda: '', jdnstr: 1869501, jdnend: 1869593 },
        { prima: 'GRATIANVS', secunda: '', jdnstr: 1869593, jdnend: 1869746 },
        { prima: 'CONSTANTINVS', secunda: '', jdnstr: 1869746, jdnend: 1871176 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1871176, jdnend: 1876290 },
        { prima: 'GUARTHIGIRN', secunda: '', jdnstr: 1876290, jdnend: 1888343 },
        { prima: 'AMBROSIUS AURELIANUS', secunda: '', jdnstr: 1888343, jdnend: 1896378 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 1896378, jdnend: 1910623 },
        { prima: 'CERDIC', secunda: '', jdnstr: 1910623, jdnend: 1916107 },
        { prima: 'CYNRIC', secunda: '', jdnstr: 1916107, jdnend: 1925598 },
        { prima: 'CEAWLIN', secunda: '', jdnstr: 1925598, jdnend: 1936921 },
        { prima: 'CEOL', secunda: '', jdnstr: 1936921, jdnend: 1939113 },
        { prima: 'CEOLWULF', secunda: '', jdnstr: 1939113, jdnend: 1944226 },
        { prima: 'CYNEGILS', secunda: '', jdnstr: 1944226, jdnend: 1949661 },
        { prima: 'CYNEGILS', secunda: 'CWICHELM', jdnstr: 1949661, jdnend: 1953314 },
        { prima: 'CYNEGILS', secunda: '', jdnstr: 1953314, jdnend: 1955549 },
        { prima: 'CENWALH', secunda: '', jdnstr: 1955549, jdnend: 1956645 },
        { prima: 'PENDA', secunda: '', jdnstr: 1956645, jdnend: 1957740 },
        { prima: 'CENWALH', secunda: '', jdnstr: 1957740, jdnend: 1966506 },
        { prima: 'SEAXBURH', secunda: '', jdnstr: 1966506, jdnend: 1967236 },
        { prima: 'ÆSCWINE', secunda: '', jdnstr: 1967236, jdnend: 1967967 },
        { prima: 'CENTWINE', secunda: '', jdnstr: 1967967, jdnend: 1971255 },
        { prima: 'CÆDWALLA', secunda: '', jdnstr: 1971255, jdnend: 1972350 },
        { prima: 'INE', secunda: '', jdnstr: 1972350, jdnend: 1986230 },
        { prima: 'ÆÐELHEARD', secunda: '', jdnstr: 1986230, jdnend: 1991343 },
        { prima: 'CUÞRED', secunda: '', jdnstr: 1991343, jdnend: 1997187 },
        { prima: 'SIGEBERHT', secunda: '', jdnstr: 1997187, jdnend: 1997553 },
        { prima: 'CYNEWULF', secunda: '', jdnstr: 1997553, jdnend: 2008145 },
        { prima: 'BEORHTRIC', secunda: '', jdnstr: 2008145, jdnend: 2013989 },
        { prima: 'ECGBERHT', secunda: '', jdnstr: 2013989, jdnend: 2027654 },
        { prima: 'ÆÞELWULF', secunda: '', jdnstr: 2027654, jdnend: 2034455 },
        { prima: 'ÆÞELBALD', secunda: '', jdnstr: 2034455, jdnend: 2035527 },
        { prima: 'ÆÐELBERHT', secunda: '', jdnstr: 2035527, jdnend: 2037272 },
        { prima: 'ÆÐELRED I', secunda: '', jdnstr: 2037272, jdnend: 2039303 },
        { prima: 'ÆLFRED', secunda: '', jdnstr: 2039303, jdnend: 2049716 },
        { prima: 'EADWEARD', secunda: '', jdnstr: 2049716, jdnend: 2058747 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2058747, jdnend: 2058763 },
        { prima: 'INTER‑REGNUM', secunda: '', jdnstr: 2058763, jdnend: 2059837 },
        { prima: 'ÆÐELSTAN', secunda: '', jdnstr: 2059837, jdnend: 2064327 },
        { prima: 'EADMUND', secunda: '', jdnstr: 2064327, jdnend: 2066730 },
        { prima: 'EADRED', secunda: '', jdnstr: 2066730, jdnend: 2070198 },
        { prima: 'EADWIG', secunda: '', jdnstr: 2070198, jdnend: 2071606 },
        { prima: 'EADGAR', secunda: '', jdnstr: 2071606, jdnend: 2077365 },
        { prima: 'EADWEARD', secunda: '', jdnstr: 2077365, jdnend: 2078349 },
        { prima: 'ÆÞELRED', secunda: '', jdnstr: 2078349, jdnend: 2091415 },
        { prima: 'SVEINN', secunda: '', jdnstr: 2091415, jdnend: 2091455 },
        { prima: 'ÆÞELRED', secunda: '', jdnstr: 2091455, jdnend: 2092265 },
        { prima: 'EADMUND', secunda: '', jdnstr: 2092265, jdnend: 2092486 },
        { prima: 'CNUT', secunda: '', jdnstr: 2092486, jdnend: 2099407 },
        { prima: 'HAROLD', secunda: '', jdnstr: 2099407, jdnend: 2100994 },
        { prima: 'HARÐACNUT', secunda: '', jdnstr: 2100994, jdnend: 2101807 },
        { prima: 'EADWEARD', secunda: '', jdnstr: 2101807, jdnend: 2110419 },
        { prima: 'HAROLD', secunda: '', jdnstr: 2110419, jdnend: 2110701 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2110701, jdnend: 2110702 },
        { prima: 'EADGAR', secunda: '', jdnstr: 2110702, jdnend: 2110758 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2110758, jdnend: 2110773 },
        { prima: 'WILLIAM I', secunda: '', jdnstr: 2110773, jdnend: 2118336 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2118336, jdnend: 2118353 },
        { prima: 'WILLIAM II', secunda: '', jdnstr: 2118353, jdnend: 2123047 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2123047, jdnend: 2123050 },
        { prima: 'HENRY I', secunda: '', jdnstr: 2123050, jdnend: 2135951 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2135951, jdnend: 2135972 },
        { prima: 'STEPHEN', secunda: '', jdnstr: 2135972, jdnend: 2137986 },
        { prima: 'MATILDA', secunda: '', jdnstr: 2137986, jdnend: 2138200 },
        { prima: 'STEPHEN', secunda: '', jdnstr: 2138200, jdnend: 2142854 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2142854, jdnend: 2142909 },
        { prima: 'HENRY II', secunda: '', jdnstr: 2142909, jdnend: 2148619 },
        { prima: 'HENRY II', secunda: 'HENRY THE YOUNG KING', jdnstr: 2148619, jdnend: 2153362 },
        { prima: 'HENRY II', secunda: '', jdnstr: 2153362, jdnend: 2155527 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2155527, jdnend: 2155586 },
        { prima: 'RICHARD I', secunda: '', jdnstr: 2155586, jdnend: 2159088 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2159088, jdnend: 2159139 },
        { prima: 'JOHN', secunda: '', jdnstr: 2159139, jdnend: 2165494 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2165494, jdnend: 2165503 },
        { prima: 'HENRY III', secunda: '', jdnstr: 2165503, jdnend: 2185976 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2185976, jdnend: 2185980 },
        { prima: 'EDWARD I', secunda: '', jdnstr: 2185980, jdnend: 2198627 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2198627, jdnend: 2198628 },
        { prima: 'EDWARD II', secunda: '', jdnstr: 2198628, jdnend: 2205764 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2205764, jdnend: 2205769 },
        { prima: 'EDWARD III', secunda: '', jdnstr: 2205769, jdnend: 2224179 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2224179, jdnend: 2224180 },
        { prima: 'RICHARD II', secunda: '', jdnstr: 2224180, jdnend: 2232314 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2232314, jdnend: 2232315 },
        { prima: 'HENRY IV', secunda: '', jdnstr: 2232315, jdnend: 2237235 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2237235, jdnend: 2237236 },
        { prima: 'HENRY V', secunda: '', jdnstr: 2237236, jdnend: 2240686 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2240686, jdnend: 2240687 },
        { prima: 'HENRY VI', secunda: '', jdnstr: 2240687, jdnend: 2254751 },
        { prima: 'EDWARD IV', secunda: '', jdnstr: 2254751, jdnend: 2258251 },
        { prima: 'HENRY VI', secunda: '', jdnstr: 2258251, jdnend: 2258441 },
        { prima: 'EDWARD IV', secunda: '', jdnstr: 2258441, jdnend: 2262822 },
        { prima: 'EDWARD V', secunda: '', jdnstr: 2262822, jdnend: 2262899 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2262899, jdnend: 2262900 },
        { prima: 'RICHARD III', secunda: '', jdnstr: 2262900, jdnend: 2263688 },
        { prima: 'HENRY VII', secunda: '', jdnstr: 2263688, jdnend: 2272331 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2272331, jdnend: 2272332 },
        { prima: 'HENRY VIII', secunda: '', jdnstr: 2272332, jdnend: 2286127 },
        { prima: 'EDWARD VI', secunda: '', jdnstr: 2286127, jdnend: 2288478 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2288478, jdnend: 2288482 },
        { prima: 'LADY JANE GREY', secunda: '', jdnstr: 2288482, jdnend: 2288491 },
        { prima: 'MARY I', secunda: '', jdnstr: 2288491, jdnend: 2288861 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2288861, jdnend: 2288862 },
        { prima: 'MARY I', secunda: 'PHILIP', jdnstr: 2288862, jdnend: 2290438 },
        { prima: 'ELIZABETH I', secunda: '', jdnstr: 2290438, jdnend: 2306636 },
        { prima: 'JAMES I', secunda: '', jdnstr: 2306636, jdnend: 2314675 },
        { prima: 'CHARLES I', secunda: '', jdnstr: 2314675, jdnend: 2323385 },
        { prima: 'CHARLES II', secunda: '', jdnstr: 2323385, jdnend: 2323385 },
        { prima: 'KEEPERS OF THE LIBERTY', secunda: '', jdnstr: 2323385, jdnend: 2325125 },
        { prima: 'OLIVER CROMWELL', secunda: '', jdnstr: 2325125, jdnend: 2326848 },
        { prima: 'RICHARD CROMWELL', secunda: '', jdnstr: 2326848, jdnend: 2327111 },
        { prima: 'KEEPERS OF THE LIBERTY', secunda: '', jdnstr: 2327111, jdnend: 2327481 },
        { prima: 'CHARLES II', secunda: '', jdnstr: 2327481, jdnend: 2336541 },
        { prima: 'JAMES II', secunda: '', jdnstr: 2336541, jdnend: 2337945 },
        { prima: 'POLYKRACIE', secunda: '', jdnstr: 2337945, jdnend: 2338009 },
        { prima: 'WILLIAM III', secunda: 'MARY II', jdnstr: 2338009, jdnend: 2340153 },
        { prima: 'WILLIAM III', secunda: '', jdnstr: 2340153, jdnend: 2342780 },
        { prima: 'ANNE', secunda: '', jdnstr: 2342780, jdnend: 2347309 },
        { prima: 'GEORGE I', secunda: '', jdnstr: 2347309, jdnend: 2352006 },
        { prima: 'GEORGE II', secunda: '', jdnstr: 2352006, jdnend: 2364174 },
        { prima: 'GEORGE III', secunda: '', jdnstr: 2364174, jdnend: 2382537 },
        { prima: 'GEORGE III', secunda: 'PRINCE REGENT', jdnstr: 2382537, jdnend: 2385817 },
        { prima: 'GEORGE IV', secunda: '', jdnstr: 2385817, jdnend: 2389618 },
        { prima: 'WILLIAM IV', secunda: '', jdnstr: 2389618, jdnend: 2392169 },
        { prima: 'VICTORIA', secunda: '', jdnstr: 2392169, jdnend: 2415394 },
        { prima: 'EDWARD VII', secunda: '', jdnstr: 2415394, jdnend: 2418785 },
        { prima: 'GEORGE V', secunda: '', jdnstr: 2418785, jdnend: 2428175 },
        { prima: 'EDWARD VIII', secunda: '', jdnstr: 2428175, jdnend: 2428501 },
        { prima: 'GEORGE VI', secunda: '', jdnstr: 2428501, jdnend: 2434036 },
        { prima: 'ELIZABETH II', secunda: '', jdnstr: 2434036, jdnend: 2459818 },
        { prima: 'CHARLES III', secunda: '', jdnstr: 2459818, jdnend: Infinity }
	];

	function jdnToSumerian(jdn) {
		let endJdn = currentEgyptianEpoch - 1;
		if (jdn > endJdn) return null;
		
		let daysBeforeEnd = endJdn - jdn;
		let totalSumerianDays = SUMERIAN_TOTAL_YEARS * 360;
		if (daysBeforeEnd >= totalSumerianDays) return null;

		let dayIndex = (totalSumerianDays - 1) - daysBeforeEnd;
		
		let currentDay = 0;
		let kingId = 0;
		let kingName = "";
		for (let i = 0; i < SUMERIAN_KINGS.length; i++) {
			let kDays = SUMERIAN_KINGS[i][1] * 360;
			if (currentDay + kDays > dayIndex) {
				kingId = i + 1;
				kingName = SUMERIAN_KINGS[i][0];
				break;
			}
			currentDay += kDays;
		}

		let daysIntoKing = dayIndex - currentDay;
		let regnalYear = Math.floor(daysIntoKing / 360) + 1;
		let dayInYear = daysIntoKing % 360;

		let month = Math.floor(dayInYear / 30) + 1;
		let day = (dayInYear % 30) + 1;

		return { kingId, kingName, year: regnalYear, month, day };
	}

	function jdnToRegnal(jdn) {
		if (jdn < currentEgyptianEpoch) {
			let sumerianObj = jdnToSumerian(jdn);
			if (sumerianObj) {
				return { prima: sumerianObj.kingName, secunda: '', year: sumerianObj.year, month: sumerianObj.month, day: sumerianObj.day };
			}
			return null;
		}
		
		let mObj = null;
		if (jdn >= currentEgyptianEpoch && jdn < 1446501) {
			let currentEgJdn = currentEgyptianEpoch;
			let totalAssignedYears = 0;
            for (let i = 0; i < EGYPTIAN_KINGS.length; i++) { totalAssignedYears += EGYPTIAN_KINGS[i][1]; }
			
            for (let i = 0; i < EGYPTIAN_KINGS.length; i++) {
				let reignDays = Math.floor((EGYPTIAN_KINGS[i][1] / totalAssignedYears) * (1446501 - currentEgyptianEpoch));
				if (i === EGYPTIAN_KINGS.length - 1) {
					reignDays = 1446501 - currentEgJdn;
				}
				if (jdn >= currentEgJdn && jdn < currentEgJdn + reignDays) {
					mObj = { prima: EGYPTIAN_KINGS[i][0], secunda: '', jdnstr: currentEgJdn, jdnend: currentEgJdn + reignDays - 1 };
					break;
				}
				currentEgJdn += reignDays;
			}
		}
		
		for (let i = 0; i < KINGS.length; i++) {
			if (jdn >= KINGS[i].jdnstr && jdn <= KINGS[i].jdnend) {
				mObj = KINGS[i];
				break;
			}
		}
		if (!mObj) return null;
		
		if (mObj && jdn < 1446501 && jdn >= currentEgyptianEpoch) {
			let daysIntoKing = jdn - mObj.jdnstr;
			let regnalYear = Math.floor(daysIntoKing / 365) + 1;
			let dayInYear = daysIntoKing % 365;
			let month = Math.floor(dayInYear / 30) + 1;
			let day = (dayInYear % 30) + 1;
			if (month > 12) month = 12;
			return { prima: mObj.prima, secunda: '', year: regnalYear, month: month, day: day };
		}

		let startJdn = mObj.jdnstr;
		if (mObj.id !== undefined) {
			for (let i = 0; i < KINGS.length; i++) {
				if (KINGS[i].id === mObj.id) {
					startJdn = KINGS[i].jdnstr;
					break;
				}
			}
		}
		
		let current = jdnToYmd(jdn);
		let start;
		
		if (jdn >= 2361222 && startJdn < 2361222) {
			let j = startJdn;
			let f = j + 1401;
			f += Math.floor((Math.floor((4 * j + 274277) / 146097) * 3) / 4) - 38;
			let e = Math.floor((4 * f + 3) / 1461);
			let g = Math.floor((1461 * e) / 4);
			let h = 5 * (f - g) + 2;
			let D = Math.floor((h % 153) / 5) + 1;
			let M = ((Math.floor(h / 153) + 2) % 12) + 1;
			let Y = e - 4716 + Math.floor((14 - M) / 12);
			start = { y: Y <= 0 ? Y - 1 : Y, m: M, d: D };
		} else {
			start = jdnToYmd(startJdn);
		}
		
		let yDiff = current.y - start.y;
		let mDiff = current.m - start.m;
		let dDiff = current.d - start.d;
		if (dDiff < 0) {
			mDiff -= 1;
			let prevM = current.m - 1;
			let prevY = current.y;
			if (prevM < 1) { prevM = 12; prevY -= 1; }
			let ay = prevY > 0 ? prevY : prevY + 1;
			dDiff += getDaysInMonth(ay, prevM);
		}
		if (mDiff < 0) {
			yDiff -= 1;
			mDiff += 12;
		}
		
		return {
			prima: mObj.prima,
			secunda: mObj.secunda,
			year: yDiff + 1,
			month: mDiff + 1,
			day: dDiff + 1
		};
	}

	function jdnToStonehenge(jdn) {
		let sumerianStartJdn = currentEgyptianEpoch - (SUMERIAN_TOTAL_YEARS * 360);
		if (jdn >= sumerianStartJdn) return null;

		const cycleLength = 20454;
		
		let firstStonehengeDay = sumerianStartJdn - 1;
		
		let daysBeforeBoundary = firstStonehengeDay - jdn;
		let lapse = Math.floor(daysBeforeBoundary / cycleLength) + 1;
		
		let diffBack = UNIVERSAL_ANCHOR - jdn;
		let daysWithinLap = diffBack % cycleLength;
		if (daysWithinLap < 0) daysWithinLap += cycleLength;
		
		let absoluteDays = cycleLength - daysWithinLap;
		if (absoluteDays === cycleLength) absoluteDays = 0;
		
		let h = Math.floor((absoluteDays * 4 + 3) / 1461);
		let hole = h + 1;
		let holeStartDay = Math.floor((h * 1461) / 4);
		let days = absoluteDays - holeStartDay + 1;
		
		return { lapse, hole, days };
	}

	function jdnToEgyptian(jdn) {
		let daysSinceEpoch = jdn - currentEgyptianEpoch;
		if (daysSinceEpoch < 0) return null;
		
		const ROMAN_START_JDN = 1460920;
		if (jdn >= ROMAN_START_JDN) return null;
		
		let year = Math.floor(daysSinceEpoch / 365) + 1;
		let dayInYear = daysSinceEpoch % 365;
		
		if (dayInYear < 360) {
			let month = Math.floor(dayInYear / 30) + 1;
			let day = (dayInYear % 30) + 1;
			return { year, month, day, epagomenal: false };
		} else {
			let epagDay = dayInYear - 360 + 1;
			return { year, month: 12, day: epagDay, epagomenal: true };
		}
	}

	function stonehengeToJdn(lapse, hole, days) {
		const cycleLength = 20454;
		let absoluteDays = Math.floor(((hole - 1) * 1461) / 4) + days - 1;
		let daysWithinLap = cycleLength - absoluteDays;
		if (daysWithinLap === cycleLength) daysWithinLap = 0;
		let firstStonehengeDay = currentEgyptianEpoch - (SUMERIAN_TOTAL_YEARS * 360) - 1;
		let phase = (((UNIVERSAL_ANCHOR - firstStonehengeDay) % cycleLength) + cycleLength) % cycleLength;
		let rem = (((daysWithinLap - phase) % cycleLength) + cycleLength) % cycleLength;
		let daysBeforeBoundary = (lapse - 1) * cycleLength + rem;
		return firstStonehengeDay - daysBeforeBoundary;
	}

	function sumerianToJdn(kingIndex, year, month, day) {
		let currentDay = 0;
		for (let i = 0; i < kingIndex; i++) {
			currentDay += SUMERIAN_KINGS[i][1] * 360;
		}
		let daysIntoKing = (year - 1) * 360 + (month - 1) * 30 + (day - 1);
		let dayIndex = currentDay + daysIntoKing;
		let totalSumerianDays = SUMERIAN_TOTAL_YEARS * 360;
		let daysBeforeEnd = (totalSumerianDays - 1) - dayIndex;
		let endJdn = currentEgyptianEpoch - 1;
		return endJdn - daysBeforeEnd;
	}

	function egyptianToJdn(year, month, day, epagomenal) {
		let daysSinceEpoch = (year - 1) * 365;
		let dayInYear = epagomenal ? (360 + day - 1) : ((month - 1) * 30 + (day - 1));
		return currentEgyptianEpoch + daysSinceEpoch + dayInYear;
	}

	function pad(n, l = 2) {
		return String(n).padStart(l, "0");
	}

	function prolepticJulianJdn(ay, m, d) {
		let astroY = ay < 0 ? ay + 1 : ay;
		let I = Math.floor((14 - m) / 12);
		let Y2 = astroY + 4800 - I;
		let M2 = m + 12 * I - 3;
		return d + Math.floor((153 * M2 + 2) / 5) + 365 * Y2 + Math.floor(Y2 / 4) - 32083;
	}

	function startOfAncientYear(y) {
		if (y > -46) return 1704987;
		if (y === -46) return 1704542;
		let diff = -46 - y;
		let leaps = Math.floor(-47 / 4) - Math.floor((y - 1) / 4);
		return 1704542 - (diff * 365 + leaps);
	}

	function ymdToJdn(ay, m, d) {
		if (ay <= -46) {
			let jdn = startOfAncientYear(ay);
			let mOrder;

			if (ay <= -713) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 90];
			} else if (ay === -46) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 92, 93, 10, 11, 12, 91];
			} else {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 91];
			}

			for (let i = 0; i < mOrder.length; i++) {
				let curM = mOrder[i];
				if (curM === m) break;
				jdn += getDaysInMonth(ay, curM);
			}
			return jdn + (d - 1);
		}
		let jdn = prolepticJulianJdn(ay, m, d);
		let astroY = ay < 0 ? ay + 1 : ay;
		if (astroY > 1752 || (astroY === 1752 && m > 9) || (astroY === 1752 && m === 9 && d >= 14)) {
			let Y2 = astroY + 4800 - Math.floor((14 - m) / 12);
			jdn = d + Math.floor((153 * (m + 12 * Math.floor((14 - m) / 12) - 3) + 2) / 5) + 365 * Y2 + Math.floor(Y2 / 4) - Math.floor(Y2 / 100) + Math.floor(Y2 / 400) - 32045;
		}
		return jdn;
	}

	function jdnToYmd(jdn) {
		if (jdn < 1704987) {
			let Y = -46 - Math.floor((1704542 - jdn) / 365.2425);
			if (Y > -46) Y = -46;

			while (startOfAncientYear(Y) <= jdn) Y++;
			Y--;

			let mStart = startOfAncientYear(Y);
			let mOrder;

			if (Y <= -713) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 90];
			} else if (Y === -46) {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 92, 93, 10, 11, 12, 91];
			} else {
				mOrder =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 91];
			}

			for (let i = 0; i < mOrder.length; i++) {
				let curM = mOrder[i];
				let dim = getDaysInMonth(Y, curM);
				if (jdn < mStart + dim) {
					return { y: Y, m: curM, d: jdn - mStart + 1 };
				}
				mStart += dim;
			}
		}

		let f = jdn + 1401;
		if (jdn > 2361221) f += Math.floor((Math.floor((4 * jdn + 274277) / 146097) * 3) / 4) - 38;
		let e = Math.floor((4 * f + 3) / 1461);
		let g = Math.floor((1461 * e) / 4);
		let h = 5 * (f - g) + 2;
		let D = Math.floor((h % 153) / 5) + 1;
		let M = ((Math.floor(h / 153) + 2) % 12) + 1;
		let Y = e - 4716 + Math.floor((14 - M) / 12);
		return { y: Y <= 0 ? Y - 1 : Y, m: M, d: D };
	}

	function getDaysInMonth(ay, m) {
		if (ay <= -46) {
			if (ay <= -713) {
				if (m === 1 || m === 3 || m === 5 || m === 8) return 31;
				if (m === 2 || m === 4 || m === 6 || m === 7 || m === 9 || m === 10) return 30;
				if (m === 90) {
					let isLeap = ay % 4 === 0;
					return isLeap ? 62 : 61;
				}
				return 0;
			}

			if (m === 1 || m === 3 || m === 5 || m === 8) return 31;
			if (m === 2 || m === 4 || m === 6 || m === 7 || m === 9 || m === 10 || m === 11) return 29;
			if (m === 12) return 28;

			if (m === 91) {
				if (ay === -46) return 23;
				let isLeap = ay % 4 === 0;
				return isLeap ? 11 : 10;
			}
			if (ay === -46) {
				if (m === 92) return 33;
				if (m === 93) return 34;
			}
			return 0;
		}
		let astroY = ay < 0 ? ay + 1 : ay;
		let isGregorian = astroY > 1752 || (astroY === 1752 && m >= 9);

		if (m === 2) {
			let isLeap = isGregorian ? astroY % 4 === 0 && (astroY % 100 !== 0 || astroY % 400 === 0) : astroY % 4 === 0;
			return isLeap ? 29 : 28;
		}
		if ([4, 6, 9, 11].includes(m)) {
			if (astroY === 1752 && m === 9) return 19;
			return 30;
		}
		return 31;
	}

	function _addStep(d, n, unit) {
		let y = parseInt(d.year),
			m = parseInt(d.month),
			day = parseInt(d.day),
			h = parseInt(d.hr);
		if (d.ampm === "PM" && h !== 12) h += 12;
		if (d.ampm === "AM" && h === 12) h = 0;
		let min = parseInt(d.min),
			sec = parseInt(d.sec);

		let isEgyptianEra = false;
		if (unit === "DEC") {
			let tempJdn = ymdToJdn(y, m, day);
			isEgyptianEra = (tempJdn >= currentEgyptianEpoch && tempJdn < 1460920);
		}

		if (["YRS", "CEN", "MIL", "YWL"].includes(unit) || (unit === "DEC" && !isEgyptianEra)) {
			let addY = n * (["YRS", "YWL"].includes(unit) ? 1 : (unit === "DEC" && !isEgyptianEra) ? 10 : unit === "CEN" ? 100 : 1000);
			let oldY = y;
			y += addY;
			if (oldY < 0 && y >= 0) y += 1;
			if (oldY > 0 && y <= 0) y -= 1;
		} else if (unit === "MON" || unit === "AY") {
			let step = n > 0 ? 1 : -1;
			let absN = Math.abs(n);
			for (let i = 0; i < absN; i++) {
				m += step;
				let maxM = y <= -46 ? 10 : 12;
				if (m > maxM) {
					m = 1;
					y++;
					if (y === 0) y = 1;
				} else if (m < 1) {
					y--;
					if (y === 0) y = -1;
					m = y <= -46 ? 10 : 12;
				}
			}
		}
		if (["YRS", "CEN", "MIL", "MON", "YWL", "AY"].includes(unit) || (unit === "DEC" && !isEgyptianEra)) {
			let maxD = getDaysInMonth(y, m);
			if (day > maxD) day = maxD;
			if (y === 1752 && m === 9 && day > 2 && day < 14) day = 14;
		}

		if (["SEC", "MIN", "HRS", "DAYS", "WEEK", "KUEN", "HOL", "LAP"].includes(unit) || (unit === "DEC" && isEgyptianEra)) {
			let jdn = ymdToJdn(y, m, day);
			let totalSec = sec + (min - 1) * 60 + h * 3600;

			if (unit === "DAYS" || unit === "KUEN") jdn += n;
			if (unit === "WEEK") jdn += n * 7;
			if (unit === "DEC" && isEgyptianEra) jdn += n * 10;
			if (unit === "HOL") jdn += Math.floor(n * 365.25);
			if (unit === "LAP") jdn += n * 20454;
			
			if (unit === "HRS") {
				h += n;
				let addDays = Math.floor(h / 24);
				jdn += addDays;
				h = h % 24;
				if (h < 0) h += 24;
				totalSec = sec + (min - 1) * 60 + h * 3600;
			}

			if (unit === "SEC") totalSec += n;
			if (unit === "MIN") totalSec += n * 60;

			let tempSec = totalSec - 1;

			function getDayLen(j) {
				let len = 86400;
				if (j % 11 === 0) len += 1;

				let dp = jdnToYmd(j);
				if (dp.m === 1 && dp.d === 1 &&[1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1988, 1990, 1991, 1996, 1999, 2006, 2009, 2017].includes(dp.y)) len += 1;
				else if (dp.m === 7 && dp.d === 1 &&[1972, 1981, 1982, 1983, 1985, 1992, 1993, 1994, 1997, 2012, 2015].includes(dp.y)) len += 1;

				return len;
			}
			while (tempSec >= getDayLen(jdn)) {
				tempSec -= getDayLen(jdn);
				jdn++;
			}
			while (tempSec < 0) {
				jdn--;
				tempSec += getDayLen(jdn);
			}
			
			let datePart = jdnToYmd(jdn);
			y = datePart.y;
			m = datePart.m;
			day = datePart.d;

			let raw_h = Math.floor(tempSec / 3600);
			if (raw_h >= 23 && tempSec >= 86160) {
				h = 23;
				min = 57;
				sec = (tempSec - 86160) + 1;
			} else {
				h = raw_h % 24;
				min = (Math.floor(tempSec / 60) % 60) + 1;
				sec = (tempSec % 60) + 1;
			}
		}

		let h12 = h % 12;
		let ampm = h >= 12 ? "PM" : "AM";
		return { year: y.toString(), month: pad(m), day: pad(day), hr: pad(h12), min: pad(min), sec: pad(sec), ampm: ampm };
	}

	class ProperTime {
		constructor(d) {
			this.year = d.year;
			this.month = d.month;
			this.day = d.day;
			this.hr = d.hr;
			this.min = d.min;
			this.sec = d.sec;
			this.ampm = d.ampm;
			this.tag = d.tag || "";
			this.verbose = d.verbose || false;
		}

		add(n, unit) {
			let newPt = new ProperTime(_addStep(this, n, unit));
			newPt.tag = this.tag;
			newPt.verbose = this.verbose;
			return newPt;
		}

		getMeta(is_he = false) {
			let ay = parseInt(this.year),
				m = parseInt(this.month),
				day = parseInt(this.day);
			let py = ay;
			
			if (this.tag === "O.S." && ay === 1752 && (m === 1 || m === 2 || (m === 3 && day < 25))) {
				py = 1751;
			}
			if (this.tag === "O.S." && ay === 1155 && (m === 1 || m === 2 || (m === 3 && day < 25))) {
				py = 1154;
			}
			if (ay === 1752 && this.tag === "") {
				if (m === 1 || m === 2 || (m === 3 && day < 25)) py = 1751;
			}
			
			if (this.tag === "N.S." && ay < 1155) {
				py += 1;
				if (py === 0) py = -1;
			}
			
			if (this.tag === "N.S." && ay === 1155 && (m === 1 || m === 2 || (m === 3 && day < 25))) {
				py = 1154;
			}
			
			let isBeforeBirth = false;
			if (py < -4) {
				isBeforeBirth = true;
			} else if (py === -4) {
				if (m < 12) isBeforeBirth = true;
				else if (m === 12 && day < 24) isBeforeBirth = true;
			}
			
			let suffix = "";
			
			if (is_he) {
				let heY = py + 10000;
				let heStr;
				
				if (heY <= 0) {
					let absHe = Math.abs(heY - 1);
					heStr = absHe.toString();
					suffix = " A.C. I.P.";
				} else {
					heStr = heY.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
					if (isBeforeBirth) suffix = " A.C.";
				}
				
				let absY = Math.abs(py);
				if (py < 0) {
					if (absY >= 46 && absY <= 80) suffix += " O.S.";
					else if (absY >= 20 && absY <= 45) suffix += " N.S.";
				} else if (ay === 1752) {
					if (m < 9 || (m === 9 && day <= 2)) suffix += " O.S.";
					else suffix += " N.S.";
				} else if (this.tag === "O.S." || this.tag === "N.S.") {
					suffix += " " + this.tag;
				} else if (ay >= 1740 && ay <= 1760) {
					if (ay < 1752) suffix += " O.S.";
					else suffix += " N.S.";
				} else if (ay >= 1145 && ay <= 1165) {
					if (ay < 1155) suffix += " N.S.";
					else suffix += " O.S.";
				}
				
				return { displayYear: heStr, suffix: suffix };
			}
			
			if (ay < 0 || py < 0) {
				let absY = Math.abs(py);
				
				if (absY >= 1 && absY <= 25) {
					if (isBeforeBirth) {
						suffix = " A.C. I.P.";
					} else {
						suffix = " I.P.";
					}
				} else {
					suffix = " A.C.";
					if (absY >= 46 && absY <= 80) suffix += " O.S.";
					else if (absY >= 20 && absY <= 45) suffix += " N.S.";
				}
			} else if (ay === 1752) {
				if (m < 9 || (m === 9 && day <= 2)) suffix = " O.S.";
				else suffix = " N.S.";
			} else if (this.tag === "O.S." || this.tag === "N.S.") {
				suffix = " " + this.tag;
			} else if (ay >= 1740 && ay <= 1760) {
				if (ay < 1752) suffix = " O.S.";
				else suffix = " N.S.";
			} else if (ay >= 1145 && ay <= 1165) {
				if (ay < 1155) suffix = " N.S.";
				else suffix = " O.S.";
			}

			return { displayYear: Math.abs(py).toString(), suffix };
		}

		toString(is_he = false, force_roman = false) {
			const meta = this.getMeta(is_he);
			let ay = parseInt(this.year);
			let jdn = ymdToJdn(ay, parseInt(this.month), parseInt(this.day));
			
			if (meta.useCanon || (!force_roman && jdn < 1460920)) {
				let alts = this.toAltFormats(is_he, force_roman);
				return alts[0];
			}
			return `${meta.displayYear} ${this.month}${FS}${this.day} ${this.hr}:${this.min}:${this.sec} ${this.ampm}${meta.suffix}`;
		}

		toAltFormats(is_he = false, force_roman = false) {
			const meta = this.getMeta(is_he);
			let ay = parseInt(this.year);
			let mi = parseInt(this.month);

			let mf = "",
				ms = "";
			if (ay <= -46) {
				const ancientNames = {
					1: "martius",
					2: "aprilis",
					3: "maius",
					4: "iunius",
					5: "quintilis",
					6: "sextilis",
					7: "september",
					8: "october",
					9: "november",
					10: "december",
					11: "ianuarius",
					12: "februarius",
					90: "dies hiberni",
					91: "mercedonius",
					92: "intercalaris prior",
					93: "intercalaris posterior",
				};
				mf = ancientNames[mi] || "";
				ms = mf ? (mi === 90 ? "dies." : mf.substring(0, 4) + ".") : "";
			} else {
				mi -= 1;
				mf = MONTHS_FULL[mi] || "";
				ms = MONTHS_SHORT[mi] || "";
			}

			const m = parseInt(this.month).toString(),
				dy = parseInt(this.day).toString();
				
			const TURKIC_ANIMALS_TR = ["BIČIN", "TAKAGU", "WT", "TONGUZ", "SIČKAN", "UD", "BARS", "TABWȘKAN", "LU", "YILAN", "YUNT", "KONY"];
			const TURKIC_ANIMALS_EN = ["MONKEY", "ROOSTER", "DOG", "PIG", "RAT", "OX", "TIGER", "RABBIT", "DRAGON", "SNAKE", "HORSE", "SHEEP"];
			
			function getEnOrdinal(n) {
				let v = n % 100;
				if (v >= 11 && v <= 13) return n + "ᵗʰ";
				let last = n % 10;
				if (last === 1) return n + "ˢᵗ";
				if (last === 2) return n + "ⁿᵈ";
				if (last === 3) return n + "ʳᵈ";
				return n + "ᵗʰ";
			}
			
			function getTrOrdinal(n) {
				let last = n % 10;
				let lastTwo = n % 100;
				let s = "INČ";
				if ([1, 5, 8].includes(last)) s = "INČ";
				else if ([2, 6, 7].includes(last)) s = "NČ";
				else if ([3, 4].includes(last)) s = "UENČ";
				else if (last === 9) s = "UNČ";
				else if (last === 0) {
					if ([10, 30, 90].includes(lastTwo)) s = "UNČ";
					else if ([20, 50, 70, 80].includes(lastTwo)) s = "INČ";
					else if ([40, 60].includes(lastTwo)) s = "WNČ";
					else s = "UENČ";
				}
				return n + s;
			}
			
			function getTurkicMonth(m) {
				const months = {
					1: "ARAM", 2: "IKINTI", 3: "UEČUENČ", 4: "TOERTWNČ",
					5: "BEȘINČ", 6: "ALTWNČ", 7: "YETWNČ", 8: "SEKIZINČ",
					9: "TOKUZUNČ", 10: "ONUNČ", 11: "ON BIRINČ", 12: "ČA‘ȘAPAT",
					90: "TOKUZ ONUNČ", 91: "TOKUZ ON BIRINČ", 92: "TOKUZ ON IKINTI", 93: "TOKUZ ON UEČUENČ"
				};
				return months[m] || getTrOrdinal(m);
			}
			
			let m_raw = parseInt(this.month);
			let d_raw = parseInt(this.day);
			
			let t_py = ay;
			let t_m = m_raw;

			if (ay > -46) {
				t_m = m_raw - 2;
				if (t_m <= 0) {
					t_m += 12;
					t_py -= 1;
					if (t_py === 0) t_py = -1;
				}
			}
			
			let animalIndex = t_py > 0 ? (t_py % 12) : ((1 - (Math.abs(t_py) % 12) + 12) % 12);
			let iteration = Math.ceil(Math.abs(t_py) / 12);
			let suffix = meta.suffix;
			
			let timeSuffix = ` ${this.hr}:${this.min}:${this.sec} ${this.ampm}`;
			
			let trFormat = `${getTrOrdinal(iteration)} ${TURKIC_ANIMALS_TR[animalIndex]} YWL , ${getTurkicMonth(t_m)} AY , ${getTrOrdinal(d_raw)} KUEN${timeSuffix}${suffix}`;
			let enFormat = `${getEnOrdinal(iteration)} ${TURKIC_ANIMALS_EN[animalIndex]} YRS , ${getEnOrdinal(t_m)} MON , ${getEnOrdinal(d_raw)} DAY${timeSuffix}${suffix}`;

			let jdn = ymdToJdn(parseInt(this.year), parseInt(this.month), parseInt(this.day));
			let eg = jdnToEgyptian(jdn);
			let egFormal = "—";
			let egShort = "—";

			if (eg) {
				let ey = eg.year;
				let season = EGYPTIAN_SEASONS[eg.month - 1] || "SHEMU";
				let seasonNum = Math.floor((Math.min(eg.month, 12) - 1) / 4) + 1;
				let monthInSeason = ((Math.min(eg.month, 12) - 1) % 4) + 1;
				
				if (!eg.epagomenal) {
					let decan = Math.floor((eg.day - 1) / 10) + 1;
					let dayInDecan = ((eg.day - 1) % 10) + 1;
					
					if (this.verbose) {
						egFormal = `${getEnOrdinal(ey)} YRS’s ${season}’s ${getEnOrdinal(monthInSeason)} MON’s ${getEnOrdinal(decan)} DEC’s ${getEnOrdinal(dayInDecan)} DAYS${timeSuffix}`;
					} else {
						let parts = [];
						if (ey !== 1) parts.push(`${getEnOrdinal(ey)} YRS`);
						parts.push(`${season}`);
						if (monthInSeason !== 1) parts.push(`${getEnOrdinal(monthInSeason)} MON`);
						if (decan !== 1) parts.push(`${getEnOrdinal(decan)} DEC`);
						if (dayInDecan !== 1) parts.push(`${getEnOrdinal(dayInDecan)} DAYS`);
						if (parts.length === 1) parts.push(`${getEnOrdinal(dayInDecan)} DAYS`);
						egFormal = `${parts.join("’s ")}${timeSuffix}`;
					}
					egShort = `${ey} ${seasonNum}${FS}${monthInSeason}\u2010${decan}${FS}${dayInDecan}`;
				} else {
					if (this.verbose) {
						egFormal = `${getEnOrdinal(ey)} YRS’s HRYW RNPT’s ${getEnOrdinal(eg.day)} DAYS${timeSuffix}`;
					} else {
						let parts = [];
						if (ey !== 1) parts.push(`${getEnOrdinal(ey)} YRS`);
						parts.push(`HRYW RNPT`);
						if (eg.day !== 1) parts.push(`${getEnOrdinal(eg.day)} DAYS`);
						if (parts.length === 1) parts.push(`${getEnOrdinal(eg.day)} DAYS`);
						egFormal = `${parts.join("’s ")}${timeSuffix}`;
					}
					egShort = `${ey}HW${eg.day}`;
				}
			}

			let su = jdnToSumerian(jdn);
			let suFormal = "—";
			let suShort = "—";
			
			if (su) {
				if (this.verbose) {
					suFormal = `${su.kingName}’s ${getEnOrdinal(su.year)} YRS’s ${getEnOrdinal(su.month)} MON’s ${getEnOrdinal(su.day)} DAYS${timeSuffix}`;
				} else {
					let parts = [];
					if (su.year !== 1) parts.push(`${getEnOrdinal(su.year)} YRS`);
					if (su.month !== 1) parts.push(`${getEnOrdinal(su.month)} MON`);
					if (su.day !== 1) parts.push(`${getEnOrdinal(su.day)} DAYS`);
					if (parts.length === 0) parts.push(`${getEnOrdinal(su.day)} DAYS`);
					suFormal = `${su.kingName}’s ${parts.join("’s ")}${timeSuffix}`;
				}
				suShort = `${su.kingId} ${su.year}\u2011${su.month}${FS}${su.day}`;
			}

			let sh = jdnToStonehenge(jdn);
			let shFormal = "—";
			let shShort = "—";
			
			if (sh) {
				if (this.verbose) {
					shFormal = `${getEnOrdinal(sh.lapse)} LAP’s ${getEnOrdinal(sh.hole)} HOL’s ${getEnOrdinal(sh.days)} DAYS${timeSuffix}`;
				} else {
					let parts = [];
					if (sh.lapse !== 1) parts.push(`${getEnOrdinal(sh.lapse)} LAP`);
					if (sh.hole !== 1) parts.push(`${getEnOrdinal(sh.hole)} HOL`);
					if (sh.days !== 1) parts.push(`${getEnOrdinal(sh.days)} DAYS`);
					if (parts.length === 0) parts.push(`${getEnOrdinal(sh.days)} DAYS`);
					shFormal = `${parts.join("’s ")}${timeSuffix}`;
				}
				shShort = `${sh.lapse}\u2011${sh.hole}${FS}${sh.days}`;
			}

			let er = jdnToRegnal(jdn);
			let erFormal = "—";
			let erShort = "—";

			if (er) {
				let kingStr = er.secunda ? `${er.prima} WITH ${er.secunda}` : er.prima;
				if (this.verbose) {
					erFormal = `${kingStr}’s ${getEnOrdinal(er.year)} YRS’s ${getEnOrdinal(er.month)} MON’s ${getEnOrdinal(er.day)} DAYS${timeSuffix}`;
				} else {
					let parts = [];
					if (er.year !== 1) parts.push(`${getEnOrdinal(er.year)} YRS`);
					if (er.month !== 1) parts.push(`${getEnOrdinal(er.month)} MON`);
					if (er.day !== 1) parts.push(`${getEnOrdinal(er.day)} DAYS`);
					if (parts.length === 0) parts.push(`${getEnOrdinal(er.day)} DAYS`);
					erFormal = `${kingStr}’s ${parts.join("’s ")}${timeSuffix}`;
				}
				erShort = `${kingStr}\u2011${er.year}${FS}${er.month}${FS}${er.day}`;
			}

			if (meta.useCanon || (!force_roman && jdn < 1460920)) {
				let canon = shFormal !== "—" ? shFormal : (suFormal !== "—" ? suFormal : (egFormal !== "—" ? egFormal : "—"));
				return [canon, canon, canon, canon, canon, canon, canon, canon, canon, canon, trFormat, enFormat, egFormal, egShort, suFormal, suShort, shFormal, shShort, erFormal, erShort];
			}
			return[`${meta.displayYear}/${this.month}/${this.day}`, `${meta.displayYear} ${this.month}/${this.day}`, `${meta.displayYear}${this.month}${this.day}`, `${meta.displayYear}${m}${dy}`, `${meta.displayYear}${this.month}${dy}`, `${meta.displayYear}${m}${this.day}`, `${meta.displayYear} ${mf} ${this.day}`, `${meta.displayYear} ${mf} ${dy}`, `${meta.displayYear} ${ms} ${dy}`, `${meta.displayYear} ${ms} ${this.day}`, trFormat, enFormat, egFormal, egShort, suFormal, suShort, shFormal, shShort, erFormal, erShort];
		}
	}

	const ptFunc = function propertime(input, off_set_japan = "", is_day_time_saving = false, verbose = false) {
		let offsetSeconds = 0;
		if (typeof off_set_japan === "string" && off_set_japan.trim() !== "") {
			let str = off_set_japan.trim().toUpperCase();
			let multiplier = 1;
			if (str.startsWith("M")) {
				multiplier = -1;
				str = str.substring(1);
			}
			let hours = 0;
			let m = str.match(/^(\d+)(?:F(\d+)TO(\d+))?$/);
			if (m) {
				hours = parseInt(m[1]);
				if (m[2] && m[3]) {
					hours += parseInt(m[2]) / parseInt(m[3]);
				}
			}
			offsetSeconds = Math.round(hours * 3600) * multiplier;
		}
		if (is_day_time_saving) {
			offsetSeconds += 3600;
		}

		if (typeof input === "object" && input !== null && !(input instanceof ptFunc)) {
			if (input.STRING !== undefined) {
				input = input.STRING.trim();
			} else {
				let u = {};
				for (let unit of UNITS) {
					if (input[unit] !== undefined) u[unit] = input[unit];
				}
				
				function getEnOrdinal(n) {
					let v = n % 100;
					if (v >= 11 && v <= 13) return n + "ᵗʰ";
					let last = n % 10;
					if (last === 1) return n + "ˢᵗ";
					if (last === 2) return n + "ⁿᵈ";
					if (last === 3) return n + "ʳᵈ";
					return n + "ᵗʰ";
				}
				
				if (u.LAP !== undefined || u.HOL !== undefined) {
					let l = u.LAP || 1;
					let h = u.HOL || 1;
					let d = u.DAYS || 1;
					let hrNum = (u.HRS || "00").replace(/AM|PM/i, "").padStart(2, '0');
					let ampm = (u.HRS || "AM").toUpperCase().includes("PM") ? "PM" : "AM";
					let m = (u.MIN || 1).toString().padStart(2, '0');
					let s = (u.SEC || 1).toString().padStart(2, '0');
					input = `${getEnOrdinal(l)} LAP’s ${getEnOrdinal(h)} HOL’s ${getEnOrdinal(d)} DAYS ${hrNum}:${m}:${s} ${ampm}`;
				} else if (u.DEC !== undefined || u.SEA !== undefined) {
					let y = u.YRS !== undefined ? u.YRS : 1;
					let seaInt = u.SEA || 1; 
					let mon = u.MON || 1; 
					let dec = u.DEC || 1; 
					let d = u.DAYS || 1; 
					let hrNum = (u.HRS || "00").replace(/AM|PM/i, "").padStart(2, '0');
					let ampm = (u.HRS || "AM").toUpperCase().includes("PM") ? "PM" : "AM";
					let m = (u.MIN || 1).toString().padStart(2, '0');
					let s = (u.SEC || 1).toString().padStart(2, '0');
					
					if (seaInt === 4 || (typeof u.SEA === "string" && u.SEA.toUpperCase().includes("HRYW"))) {
						input = `${getEnOrdinal(y)} YRS’s HRYW RNPT’s ${getEnOrdinal(d)} DAYS ${hrNum}:${m}:${s} ${ampm}`;
					} else {
						let season = EGYPTIAN_SEASONS[seaInt - 1] || "SHEMU";
						input = `${getEnOrdinal(y)} YRS’s ${season}’s ${getEnOrdinal(mon)} MON’s ${getEnOrdinal(dec)} DEC’s ${getEnOrdinal(d)} DAYS ${hrNum}:${m}:${s} ${ampm}`;
					}
				} else {
					let y = (u.YRS !== undefined ? u.YRS : new Date().getFullYear()).toString().trim();
					let mon = u.MON !== undefined ? u.MON : 1;
					let d = u.DAYS !== undefined ? u.DAYS : 1;
					let hr = (u.HRS !== undefined ? u.HRS : "00AM").toString().trim();
					let hrNum = hr.replace(/AM|PM/i, "").padStart(2, '0');
					let ampm = hr.toUpperCase().includes("PM") ? "PM" : "AM";
					let m = (u.MIN !== undefined ? u.MIN : 1).toString().padStart(2, '0');
					let s = (u.SEC !== undefined ? u.SEC : 1).toString().padStart(2, '0');
					
					let yMatch = y.match(/^(-?\d+)(.*)$/);
					let yNum = yMatch ? yMatch[1] : y;
					let suffix = yMatch ? yMatch[2].replace(/\s/g, "") : "";
					
					input = `${yNum}${mon.toString().padStart(2, '0')}${d.toString().padStart(2, '0')}${hrNum}${m}${s}${ampm}${suffix}`;
				}
			}
		}

		if (typeof input === "string") {
			let normInput = input.replace(/ /g, "\u00A0").replace(/[-\u2010]/g, "\u2011").trim();
			
			const ord = "(?:[ᵗˢⁿʳʰᵈ]+|th|st|nd|rd)?";
			const tStr = "\\u00A0+(0?\\d|1[0-2]):(\\d{2}):(\\d{2,3})\\u00A0+(AM|PM)";
			
			const PATTERNS = {
				shFormal: new RegExp(`^(\\d+)${ord}\\u00A0LAP’s\\u00A0(\\d+)${ord}\\u00A0HOL’s\\u00A0(\\d+)${ord}\\u00A0DAYS${tStr}$`, "i"),
				shShort: new RegExp(`^(\\d+)\\u2011(\\d+)[\\u2044\\/](\\d+)${tStr}$`, "i"),
				suFormal: new RegExp(`^(.+?)’s\\u00A0(\\d+)${ord}\\u00A0YRS’s\\u00A0(\\d+)${ord}\\u00A0MON’s\\u00A0(\\d+)${ord}\\u00A0DAYS${tStr}$`, "i"),
				suShort: new RegExp(`^(\\d+)\\u00A0(\\d+)\\u2011(\\d+)[\\u2044\\/](\\d+)${tStr}$`, "i"),
				egEpagFormal: new RegExp(`^(\\d+)${ord}\\u00A0YRS’s\\u00A0HRYW\\u00A0RNPT’s\\u00A0(\\d+)${ord}\\u00A0DAYS${tStr}$`, "i"),
				egFormal: new RegExp(`^(\\d+)${ord}\\u00A0YRS’s\\u00A0(AKHET|PERET|SHEMU)’s\\u00A0(\\d+)${ord}\\u00A0MON’s\\u00A0(\\d+)${ord}\\u00A0DEC’s\\u00A0(\\d+)${ord}\\u00A0DAYS${tStr}$`, "i"),
				egEpagShort: new RegExp(`^(\\d+)HW(\\d+)${tStr}$`, "i"),
				egShort: new RegExp(`^(\\d+)\\u00A0(\\d+)[\\u2044\\/](\\d+)\\u2011(\\d+)[\\u2044\\/](\\d+)${tStr}$`, "i")
			};

			let jdnFound = null;
			let tMatch = null;
			let match;

			if ((match = normInput.match(PATTERNS.shFormal))) {
				jdnFound = stonehengeToJdn(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
				tMatch = match.slice(4);
			} else if ((match = normInput.match(PATTERNS.shShort))) {
				jdnFound = stonehengeToJdn(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
				tMatch = match.slice(4);
			} else if ((match = normInput.match(PATTERNS.suFormal))) {
				let kName = match[1].toUpperCase();
				let kIdx = SUMERIAN_KINGS.findIndex(k => k[0] === kName);
				if (kIdx === -1) throw new Error("Invalid Sumerian King: " + kName);
				jdnFound = sumerianToJdn(kIdx, parseInt(match[2]), parseInt(match[3]), parseInt(match[4]));
				tMatch = match.slice(5);
			} else if ((match = normInput.match(PATTERNS.suShort))) {
				let kIdx = parseInt(match[1]) - 1;
				if (kIdx < 0 || kIdx >= SUMERIAN_KINGS.length) throw new Error("Invalid Sumerian King ID: " + match[1]);
				jdnFound = sumerianToJdn(kIdx, parseInt(match[2]), parseInt(match[3]), parseInt(match[4]));
				tMatch = match.slice(5);
			} else if ((match = normInput.match(PATTERNS.egEpagFormal))) {
				jdnFound = egyptianToJdn(parseInt(match[1]), 12, parseInt(match[2]), true);
				tMatch = match.slice(3);
			} else if ((match = normInput.match(PATTERNS.egFormal))) {
				let seasonIdx = ["AKHET", "PERET", "SHEMU"].indexOf(match[2].toUpperCase());
				let monthInSeason = parseInt(match[3]);
				let month = seasonIdx * 4 + monthInSeason;
				let decan = parseInt(match[4]);
				let dayInDecan = parseInt(match[5]);
				let day = (decan - 1) * 10 + dayInDecan;
				jdnFound = egyptianToJdn(parseInt(match[1]), month, day, false);
				tMatch = match.slice(6);
			} else if ((match = normInput.match(PATTERNS.egEpagShort))) {
				jdnFound = egyptianToJdn(parseInt(match[1]), 12, parseInt(match[2]), true);
				tMatch = match.slice(3);
			} else if ((match = normInput.match(PATTERNS.egShort))) {
				let season = parseInt(match[2]);
				let monthInSeason = parseInt(match[3]);
				let month = (season - 1) * 4 + monthInSeason;
				let decan = parseInt(match[4]);
				let dayInDecan = parseInt(match[5]);
				let day = (decan - 1) * 10 + dayInDecan;
				jdnFound = egyptianToJdn(parseInt(match[1]), month, day, false);
				tMatch = match.slice(6);
			}

			if (jdnFound !== null) {
				let ymd = jdnToYmd(jdnFound);
				let hr = pad(parseInt(tMatch[0]));
				let min = pad(parseInt(tMatch[1]));
				let sec = pad(parseInt(tMatch[2]));
				let ampm = tMatch[3].toUpperCase();
				return new ProperTime({ year: ymd.y.toString(), month: pad(ymd.m), day: pad(ymd.d), hr, min, sec, ampm, verbose }).add(offsetSeconds, "SEC");
			}

			let inputTag = input.toUpperCase();
			let suffix = "";
			if (inputTag.includes("A.C.")) suffix = "A.C.";
			else if (inputTag.includes("I.P.")) suffix = "I.P.";
			else if (inputTag.includes("O.S.")) suffix = "O.S.";
			else if (inputTag.includes("N.S.")) suffix = "N.S.";

			let s = input
				.replace(/\s/g, "")
				.replace(/A\.C\./i, "")
				.replace(/I\.P\./i, "")
				.replace(/O\.S\./i, "")
				.replace(/N\.S\./i, "");
			let isAC = inputTag.includes("A.C.");
			let isIP = inputTag.includes("I.P.");
			let isBC = isAC || isIP || s.startsWith("-");
			if (s.startsWith("-")) s = s.substring(1);
			if (s.length < 11) throw new Error("Invalid propertime string");

			let is3DigitSec = /1157\d{3}PM$/i.test(s);
			let secLen = is3DigitSec ? 3 : 2;
			let ampm = s.slice(-2).toUpperCase();
			let sec = parseInt(s.slice(-2 - secLen, -2));
			let min = parseInt(s.slice(-4 - secLen, -2 - secLen));
			let hr = parseInt(s.slice(-6 - secLen, -4 - secLen));
			let dateStr = s.slice(0, -6 - secLen);

			const day = parseInt(dateStr.slice(-2));
			const month = parseInt(dateStr.slice(-4, -2));
			let py = parseInt(dateStr.slice(0, -4));

			if (isBC) py = -py;

			let resolvedTag = suffix;
			if (suffix === "O.S." || suffix === "N.S.") {
				if (py >= 1154 && py <= 1155) {
				} else if (py === 1752) {
				} else if (py >= 1145 && py <= 1153) {
					if (suffix === "O.S.") throw new Error(`Invalid date.`);
				} else if (py >= 1156 && py <= 1739) {
					if (suffix === "N.S.") throw new Error(`Invalid date.`);
				} else if (py >= 1740 && py <= 1751) {
					if (suffix === "N.S.") throw new Error(`Invalid date.`);
				} else if (py >= 1753 && py <= 1760) {
					if (suffix === "O.S.") throw new Error(`Invalid date.`);
				} else if (py > 1760) {
					if (suffix === "O.S.") throw new Error(`Invalid date.`);
				}
			} else if (!isBC) {
				if (py >= 1154 && py <= 1155) {
					throw new Error(`Invalid date.`);
				} else if (py === 1752) {
					throw new Error(`Invalid date.`);
				} else if (py >= 1155 && py <= 1739) {
					resolvedTag = "O.S.";
				} else if (py >= 1740 && py <= 1751) {
					resolvedTag = "O.S.";
				} else if (py >= 1753 && py <= 1760) {
					resolvedTag = "N.S.";
				}
			}

			let applyParserLadyDayShift = false;
			if (resolvedTag === "O.S." && py <= 1751) {
				applyParserLadyDayShift = true;
			}
			
			let ay = py;
			if (applyParserLadyDayShift && (month === 1 || month === 2 || (month === 3 && day < 25))) {
				ay = py + 1;
			}
			
			let targetMonth = month;
			let targetDay = day;
			if (py === 1752 && resolvedTag === "N.S." && month === 1 && day === 1) {
				targetMonth = 9;
				targetDay = 14;
			}
			
			let jdnCheck = ymdToJdn(ay, targetMonth, targetDay);
			let rt = jdnToYmd(jdnCheck);
			if (rt.y !== ay || rt.m !== targetMonth || rt.d !== targetDay) {
				throw new Error(`Invalid date.`);
			}

			return new ProperTime({ year: ay.toString(), month: pad(targetMonth), day: pad(targetDay), hr: pad(hr), min: pad(min), sec: pad(sec), ampm, tag: resolvedTag, verbose }).add(offsetSeconds, "SEC");
		}

		const now = new Date();
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: "Asia/Tokyo",
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			hour12: false,
		}).formatToParts(now);

		let Y, M, D, H, m, s;
		parts.forEach((p) => {
			if (p.type === "year") Y = parseInt(p.value);
			if (p.type === "month") M = parseInt(p.value);
			if (p.type === "day") D = parseInt(p.value);
			if (p.type === "hour") H = parseInt(p.value);
			if (p.type === "minute") m = parseInt(p.value);
			if (p.type === "second") s = parseInt(p.value);
		});

		if (H === 24) H = 0;
		let tempSec = s + (m * 60) + (H * 3600);
		let n_h = Math.floor(tempSec / 3600) % 24;
		let n_min, n_sec;
		if (n_h === 23 && tempSec >= 86160) {
			n_min = 57;
			n_sec = (tempSec - 86160) + 1;
		} else {
			n_min = (Math.floor(tempSec / 60) % 60) + 1;
			n_sec = (tempSec % 60) + 1;
		}

		let hr12 = n_h % 12;
		let ampm = n_h >= 12 ? "PM" : "AM";

		return new ProperTime({
			year: Y.toString(),
			month: pad(M),
			day: pad(D),
			hr: pad(hr12),
			min: pad(n_min),
			sec: pad(n_sec),
			ampm: ampm,
			verbose: verbose
		}).add(offsetSeconds, "SEC");
	};

	ptFunc.setEgyptianEpoch = function(yearBCE) {
		if (yearBCE === 2782) currentEgyptianEpoch = EGYPTIAN_EPOCH_2782;
		else if (yearBCE === 2776) currentEgyptianEpoch = EGYPTIAN_EPOCH_2776;
		else if (yearBCE === 2773) currentEgyptianEpoch = EGYPTIAN_EPOCH_2773;
	};

	ptFunc.getclndr = function(input, targetEra = "AUTO", is_he = false) {
		function getEnOrdinal(n) {
			let v = n % 100;
			if (v >= 11 && v <= 13) return n + "ᵗʰ";
			let last = n % 10;
			if (last === 1) return n + "ˢᵗ";
			if (last === 2) return n + "ⁿᵈ";
			if (last === 3) return n + "ʳᵈ";
			return n + "ᵗʰ";
		}
		
		let t = ptFunc(input);
		let jdn = ymdToJdn(parseInt(t.year), parseInt(t.month), parseInt(t.day));
		
		let era = targetEra.toUpperCase();
		if (era === "AUTO") {
			if (jdn < currentEgyptianEpoch - (SUMERIAN_TOTAL_YEARS * 360)) era = "STONEHENGE";
			else if (jdn < currentEgyptianEpoch) era = "SUMERIAN";
			else if (jdn < 1460920) era = "EGYPTIAN";
			else era = "NATIVE";
		}
		
		function getPeriodIdentifier(pt) {
			let j = ymdToJdn(parseInt(pt.year), parseInt(pt.month), parseInt(pt.day));
			if (era === "STONEHENGE") {
				let sh = jdnToStonehenge(j);
				return sh ? `${sh.lapse}-${sh.hole}` : pt.getMeta(is_he).displayYear;
			}
			if (era === "SUMERIAN") {
				let su = jdnToSumerian(j);
				return su ? `${su.kingId}-${su.year}` : pt.getMeta(is_he).displayYear;
			}
			if (era === "EGYPTIAN") {
				let eg = jdnToEgyptian(j);
				return eg ? `${eg.year}` : pt.getMeta(is_he).displayYear;
			}
			let meta = pt.getMeta(is_he);
			return meta.displayYear + meta.suffix;
		}
		
		let startDay = t;
		let periodId = getPeriodIdentifier(startDay);
		
		let prevDay = startDay.add(-1, "DAYS");
		while (getPeriodIdentifier(prevDay) === periodId) {
			startDay = prevDay;
			prevDay = startDay.add(-1, "DAYS");
		}
		
		let calendar = [];
		let currentDay = startDay;
		let currentMonthName = null;
		let currentMonthObj = null;
		
		while (getPeriodIdentifier(currentDay) === periodId) {
			let mName = "";
			let isEpag = false;
			let dayNum = "?";
			
			let j = ymdToJdn(parseInt(currentDay.year), parseInt(currentDay.month), parseInt(currentDay.day));
			
			if (era === "STONEHENGE") {
				let sh = jdnToStonehenge(j);
				mName = "HOL";
				dayNum = sh.days;
			} else if (era === "SUMERIAN") {
				let su = jdnToSumerian(j);
				mName = `${getEnOrdinal(su.month)} MON`;
				dayNum = su.day;
			} else if (era === "EGYPTIAN") {
				let eg = jdnToEgyptian(j);
				if (eg.epagomenal) {
					mName = "HRYW RNPT";
					isEpag = true;
					dayNum = eg.day;
				} else {
					let season = EGYPTIAN_SEASONS[eg.month - 1] || "SHEMU";
					let monthInSeason = ((eg.month - 1) % 4) + 1;
					mName = `${season} ${getEnOrdinal(monthInSeason)} MON`;
					dayNum = eg.day; 
				}
			} else {
				let mi = parseInt(currentDay.month);
				if (parseInt(currentDay.year) <= -46) {
					const ancientRomanNames = {
						1: "Martius", 2: "Aprilis", 3: "Maius", 4: "Iunius", 5: "Quintilis",
						6: "Sextilis", 7: "September", 8: "October", 9: "November", 10: "December",
						11: "Ianuarius", 12: "Februarius", 90: "Dies Hiberni", 91: "Mercedonius",
						92: "Intercalaris Prior", 93: "Intercalaris Posterior"
					};
					mName = ancientRomanNames[mi] || `Month ${mi}`;
				} else {
					const modernNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
					mName = modernNames[mi - 1] || `Month ${mi}`;
				}
				dayNum = parseInt(currentDay.day);
			}
			
			if (mName !== currentMonthName) {
				if (currentMonthObj) calendar.push(currentMonthObj);
				currentMonthName = mName;
				currentMonthObj = {
					title: mName,
					isEpagomenal: isEpag,
					days: []
				};
			}
			currentMonthObj.days.push(dayNum);
			
			currentDay = currentDay.add(1, "DAYS");
		}
		if (currentMonthObj) calendar.push(currentMonthObj);
		
		return calendar;
	};

	ptFunc.getclndrmodern = function(input) {
		let t = ptFunc(input);
		let y = parseInt(t.year);
		if (y < 1800) {
			throw new Error("Invalid date.");
		}
		
		let isLeap = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
		let monthDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		
		let modernCal = [];
		let wknds = {};
		
		for (let m = 0; m < 12; m++) {
			let numDays = monthDays[m];
			let weekdays = [];
			let weekendCols = [];
			
			for (let d = 1; d <= 7; d++) {
				let jsDate = new Date(y, m, d);
				let dayOfWeek = jsDate.getDay();
				weekdays.push(dayNames[dayOfWeek]);
				if (dayOfWeek === 0 || dayOfWeek === 6) {
					weekendCols.push(d - 1);
				}
			}
			
			let monthWknds = [];
			let rows = [];
			for(let row = 0; row < 5; row++) {
				let rowData = [];
				for(let col = 0; col < 7; col++) {
					let dayNum = row * 7 + col + 1;
					if (dayNum <= numDays) {
						rowData.push(dayNum);
						if (weekendCols.includes(col)) {
							monthWknds.push(dayNum);
						}
					}
				}
				if (rowData.length > 0) rows.push(rowData);
			}
			
			wknds[m + 1] = monthWknds;
			
			let emptyColspan = 0;
			let lastRow = rows[rows.length - 1];
			if (lastRow.length < 7) {
				emptyColspan = 7 - lastRow.length;
			}
			
			modernCal.push({
				title: monthNames[m],
				weekdays: weekdays,
				rows: rows,
				emptyColspan: emptyColspan
			});
		}
		
		return {
			calendar: modernCal,
			wknds: wknds
		};
	};

	ptFunc.toJDN = function (civilYear, month, day) {
		return ymdToJdn(parseInt(civilYear), parseInt(month), parseInt(day));
	};
	ptFunc.fromJDN = function (jdn) {
		return jdnToYmd(parseInt(jdn));
	};
	ptFunc.jdnDiff = function (cy1, m1, d1, cy2, m2, d2) {
		return ymdToJdn(cy2, m2, d2) - ymdToJdn(cy1, m1, d1);
	};

	return ptFunc;
})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = propertime;
} else if (typeof define === 'function' && define.amd) {
	define([], function () { return propertime; });
} else {
	if (typeof globalThis !== 'undefined') {
		globalThis.propertime = propertime;
	} else if (typeof window !== 'undefined') {
		window.propertime = propertime;
	} else if (typeof global !== 'undefined') {
		global.propertime = propertime;
	}
}
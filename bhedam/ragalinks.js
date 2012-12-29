// Format is [["",0,0,0,0],["raga name", spanid, wikiLink, wikiText, asciiWT],...]
var RagaLinks = [["",0,0,0,0],["Kanakāmbari",0,0,1,2],["Kanakambari",0,0,1,2],["Karnataka Shuddha Saveri",0,3,4,3],["Karnātaka Shuddha Sāveri",0,3,4,3],["Rishabhavilāsa",0,0,5,6],["Rishabhavilasa",0,0,5,6],["Suddha Mukhāri",0,0,7,8],["Suddha Mukhari",0,0,7,8],["Vāgeeshwari",0,0,9,10],["Vageeshwari",0,0,9,10],["Rathnangi",11,12,13,11],["Ratnangi",11,12,13,11],["Rathnāngi",11,12,13,11],["Phenadhyuti",0,0,14,14],["Ratnavarāli",0,0,15,16],["Ratnavarali",0,0,15,16],["Revati (raga)",0,17,18,18],["Revati",0,17,18,18],["Shreemani",0,0,19,19],["Ganamoorti",20,21,22,20],["Ganamurti",20,21,22,20],["Gānamoorti",20,21,22,20],["Gānasāmavarāli",0,0,23,24],["Ganasamavarali",0,0,23,24],["Nādharanjani",0,0,25,26],["Nadharanjani",0,0,25,26],["Sāmavarāli",0,0,27,28],["Samavarali",0,0,27,28],["Vanaspati",29,30,29,29],["Vanaspati (Raga)",29,30,29,29],["Bhānumati",0,0,31,32],["Bhanumati",0,0,31,32],["Vanāvali",0,0,33,34],["Vanavali",0,0,33,34],["Manavati",35,35,36,35],["Mānavati",35,35,36,35],["Manoranjani",0,0,37,37],["Kunjari",0,0,38,38],["Tanaroopi",39,40,41,39],["Tanarupi",39,40,41,39],["Tānaroopi",39,40,41,39],["Tanukeerti",0,0,42,42],["Senavati",43,43,44,43],["Senāvati",43,43,44,43],["Senāgrani",0,0,45,46],["Senagrani",0,0,45,46],["Chitthakarshani",0,0,47,47],["Sindhu Gowri",0,0,48,48],["Hanumatodi",49,49,49,49],["Janatodi",0,0,50,50],["Asāveri",0,0,51,52],["Asaveri",0,0,51,52],["Bhadratodi",0,0,53,53],["Bhupalam",0,54,55,56],["Bhoopālam",0,54,55,56],["Bhoopalam",0,54,55,56],["Chandrikatodi",0,0,57,57],["Dhanyāsi",0,0,58,59],["Dhanyasi",0,0,58,59],["Ghanta",0,0,60,60],["Kanakasāveri",0,0,61,62],["Kanakasaveri",0,0,61,62],["Prabhupriya",0,0,63,63],["Punnāgavarāli",0,0,64,65],["Punnagavarali",0,0,64,65],["Sowjanya",0,0,66,66],["Shuddha Todi",0,0,67,67],["Dhenuka",68,68,68,68],["Dhunibhinnashadjam",0,0,69,69],["Mohananāta",0,0,70,71],["Mohananata",0,0,70,71],["Vasanthatodi",0,0,72,72],["Natakapriya",73,73,74,73],["Nātakapriya",73,73,74,73],["Natābharanam",0,0,75,76],["Natabharanam",0,0,75,76],["Bhāgyashabari",0,0,77,78],["Bhagyashabari",0,0,77,78],["Gunāvati",0,0,79,80],["Gunavati",0,0,79,80],["Kanakadri",0,0,81,81],["Nātyadhārana",0,0,82,83],["Natyadharana",0,0,82,83],["Shānthabhāshini",0,0,84,85],["Shanthabhashini",0,0,84,85],["Sindu Bhairavi",0,86,86,86],["Kokilapriya",87,87,87,87],["Kokilāravam",0,0,88,89],["Kokilaravam",0,0,88,89],["Jnānachintāmani",0,0,90,91],["Jnanachintamani",0,0,90,91],["Shuddha Lalitha",0,0,92,92],["Vasantamalli",0,0,93,93],["Roopavati",94,95,95,95],["Rupavati",94,95,95,95],["Rowpyanaka",0,0,96,96],["Gayakapriya",97,97,98,97],["Gāyakapriya",97,97,98,97],["Geya Hejjajji",0,0,99,99],["Kalākānti",0,0,100,101],["Kalakanti",0,0,100,101],["Kalpanadhārini",0,0,102,103],["Kalpanadharini",0,0,102,103],["Vakulabharanam",104,104,105,104],["Vakulābharanam",104,104,105,104],["Vātee Vasantabhairavi",0,0,106,107],["Vatee Vasantabhairavi",0,0,106,107],["Amudhasurabhi",0,0,108,108],["Kuvalayabharanam",0,0,109,109],["Shuddha Kāmbhoji",0,0,110,111],["Shuddha Kambhoji",0,0,110,111],["Vasanta Mukhāri",0,0,112,113],["Vasanta Mukhari",0,0,112,113],["Mayamalavagowla",114,114,115,116],["Māyamālava Gowla",114,114,115,116],["Mayamalava Gowla",114,114,115,116],["Ardhradesi",0,0,117,117],["Bibhās",0,0,118,119],["Bibhas",0,0,118,119],["Bowli Rāmakriya",0,0,120,121],["Bowli Ramakriya",0,0,120,121],["Chāyagowla",0,0,122,123],["Chayagowla",0,0,122,123],["Deshyagowla",0,0,124,124],["Ghanasindhu",0,0,125,125],["Gowlipantu",0,0,126,126],["Gummakāmbhoji",0,0,127,128],["Gummakambhoji",0,0,127,128],["Gurjari",0,0,129,129],["Kalyānakesari",0,0,130,131],["Kalyanakesari",0,0,130,131],["Karnātaka Sāranga",0,0,132,133],["Karnataka Saranga",0,0,132,133],["Lalitapanchamam",0,0,134,134],["Mālavapanchamam",0,0,135,136],["Malavapanchamam",0,0,135,136],["Malahari",0,137,137,137],["Maruva",0,0,138,138],["Megharanjani",0,0,139,139],["Pādi",0,0,140,141],["Padi",0,0,140,141],["Poorvi",0,0,142,142],["Pratāpadhanyāsi",0,0,143,144],["Pratapadhanyasi",0,0,143,144],["Puranirmai",0,0,145,145],["Rāmakriya",0,0,146,147],["Ramakriya",0,0,146,147],["Rukhmāmbari",0,0,148,149],["Rukhmambari",0,0,148,149],["Sāranga Nāta",0,0,150,151],["Saranga Nata",0,0,150,151],["Saveri",0,152,153,152],["Sāveri",0,152,153,152],["Salanganāta",0,0,154,155],["Salanganata",0,0,154,155],["Sindhu Rāmakriya",0,0,156,157],["Sindhu Ramakriya",0,0,156,157],["Tārakagowla",0,0,158,159],["Tarakagowla",0,0,158,159],["Ushāvali",0,0,160,161],["Ushavali",0,0,160,161],["Chakravakam",162,163,164,162],["Chakravakam(raga)",162,163,164,162],["Chakravākam",162,163,164,162],["Toyavegavāhini",0,0,165,166],["Toyavegavahini",0,0,165,166],["Bhakthapriya",0,0,167,167],["Bindhumālini",0,0,168,169],["Bindhumalini",0,0,168,169],["Ghoshini",0,0,170,170],["Kalāvati",0,0,171,172],["Kalavati",0,0,171,172],["Malayamarutam",0,173,174,173],["Malayamārutam",0,173,174,173],["Mukundamālini",0,0,175,176],["Mukundamalini",0,0,175,176],["Pravritti",0,0,177,177],["Rasikaranjani",0,0,178,178],["Shyāmali",0,0,179,180],["Shyamali",0,0,179,180],["Valaji",0,181,181,181],["Vegavāhini",0,0,182,183],["Vegavahini",0,0,182,183],["Sooryakantam",184,185,186,184],["Suryakantam",184,185,186,184],["Sooryakāntam",184,185,186,184],["Chāyāvathi",0,0,187,188],["Chayavathi",0,0,187,188],["Haridarpa",0,0,189,189],["Jeevantikā",0,0,190,191],["Jeevantika",0,0,190,191],["Nāgachooḍāmani",0,0,192,193],["Nagachooḍamani",0,0,192,193],["Sāmakannada",0,0,194,195],["Samakannada",0,0,194,195],["Suddha Gowla",0,0,196,196],["Vasanthā",0,0,197,198],["Vasantha",0,0,197,198],["Hatakambari",199,199,200,199],["Hatakāmbari",199,199,200,199],["Jayashuddhamālavi",0,0,201,202],["Jayashuddhamalavi",0,0,201,202],["Kallola",0,0,203,203],["Jhankaradhwani",204,205,206,205],["Jhankaradhvani",204,205,206,205],["Jhankāradhvani",204,205,206,205],["Jhankārabhramari",0,0,207,208],["Jhankarabhramari",0,0,207,208],["Bhārati",0,0,209,210],["Bharati",0,0,209,210],["Lalitabhairavi",0,0,211,211],["Natabhairavi",212,212,212,212],["Nārērētigowla",0,0,213,214],["Nareretigowla",0,0,213,214],["Anandabhairavi",0,215,215,215],["Amrithavāhini",0,0,216,217],["Amrithavahini",0,0,216,217],["Bhairavi (ragam)",0,218,219,219],["Bhairavi",0,218,219,219],["Bhuvanagāndhāri",0,0,220,221],["Bhuvanagandhari",0,0,220,221],["Darbāri Kānada",0,0,222,223],["Darbari Kanada",0,0,222,223],["Dhanashree",0,0,224,224],["Dilipika Vasantha",0,0,225,225],["Gopikāvasantam",0,0,226,227],["Gopikavasantam",0,0,226,227],["Hindolam",0,228,228,228],["Hindolavasanta",0,0,229,229],["Jayanthashrī",0,0,230,230],["Jonpuri",0,0,231,231],["Kanakavasantham",0,0,232,232],["Mānji",0,0,233,234],["Manji",0,0,233,234],["Malkosh",0,0,235,235],["Navarathna Vilāsam",0,0,236,237],["Navarathna Vilasam",0,0,236,237],["Nīlaveni",0,0,238,238],["Rājarājeshwari",0,0,239,240],["Rajarajeshwari",0,0,239,240],["Saramati",0,241,242,241],["Sāramati",0,241,242,241],["Sāranga Kāpi",0,0,243,244],["Saranga Kapi",0,0,243,244],["Shree Navarasachandrika",0,0,245,245],["Shuddha Desi",0,0,246,246],["Sukumāri",0,0,247,248],["Sukumari",0,0,247,248],["Sutradhāri",0,0,249,250],["Sutradhari",0,0,249,250],["Udayaravichandrika",0,251,252,253],["Udayarāga",0,251,252,253],["Udayaraga",0,251,252,253],["Keeravani",254,254,255,254],["Keeravāni",254,254,255,254],["Keeranāvali",0,0,256,257],["Keeranavali",0,0,256,257],["Bhānupriya",0,0,258,259],["Bhanupriya",0,0,258,259],["Gaganabhoopālam",0,0,260,261],["Gaganabhoopalam",0,0,260,261],["Hamsavāhini",0,0,262,263],["Hamsavahini",0,0,262,263],["Kadaram(Chandra, Chandrakowns)",0,0,264,264],["Kusumāvali",0,0,265,266],["Kusumavali",0,0,265,266],["Mishramanolayam",0,0,267,267],["Rishipriya",0,0,268,268],["Shrothasvini",0,0,269,269],["Kharaharapriya",270,270,270,270],["Shree",0,0,271,271],["Abheri",0,272,272,272],["[[Abhogi]]",0,0,273,273],["Āryamati",0,0,274,274],["Basant Bahār",0,0,275,276],["Basant Bahar",0,0,275,276],["Bhagavatapriya",0,0,277,277],["Bhimpalās",0,0,278,279],["Bhimpalas",0,0,278,279],["Brindāvani",0,0,280,281],["Brindavani",0,0,280,281],["Chitta Ranjani",0,0,282,282],["Dayavati",0,0,283,283],["Deva Manohari",0,0,284,284],["Dilipika",0,0,285,285],["Gowla Kannada",0,0,286,286],["Haridasapriya",0,0,287,287],["Hindustāni Kāpi",0,0,288,289],["Hindustani Kapi",0,0,288,289],["Jayamanohari",0,0,290,290],["Jayanthasena",0,0,291,291],["Kāpi",0,292,292,293],["Kapi",0,292,292,293],["Kalānidhi",0,0,294,295],["Kalanidhi",0,0,294,295],["Kannadagowla",0,0,296,296],["Karnātaka Kāpi",0,0,297,298],["Karnataka Kapi",0,0,297,298],["Kowmodaki",0,0,299,299],["Lalitamanohari",0,0,300,300],["Mālavashree",0,0,301,302],["Malavashree",0,0,301,302],["Māyapradeeptam",0,0,303,304],["Mayapradeeptam",0,0,303,304],["Madhyamavathi",0,305,306,305],["Madhyamāvathi",0,305,306,305],["Mandāmari",0,0,307,308],["Mandamari",0,0,307,308],["Manirangu",0,0,309,309],["Manohari",0,0,310,310],["Maruvadhanyāsi",0,0,311,312],["Maruvadhanyasi",0,0,311,312],["Mishrashivaranjani",0,0,313,313],["Moorthee",0,0,314,314],["Nādachintāmani",0,0,315,316],["Nadachintamani",0,0,315,316],["Nādavarangini",0,0,317,318],["Nadavarangini",0,0,317,318],["Nāgavalli",0,0,319,320],["Nagavalli",0,0,319,320],["Nigamagāmini",0,0,321,322],["Nigamagamini",0,0,321,322],["Omkāri",0,0,323,324],["Omkari",0,0,323,324],["Patadeep",0,0,325,325],["Phalaranjani",0,0,326,326],["Poornakalānidhi",0,0,327,328],["Poornakalanidhi",0,0,327,328],["Ratipatipriya",0,0,329,329],["Rudrapriyā",0,0,330,331],["Rudrapriya",0,0,330,331],["Sārang",0,0,332,333],["Sarang",0,0,332,333],["Sangrama",0,0,334,334],["Sarvachoodāmani",0,0,335,336],["Sarvachoodamani",0,0,335,336],["Shivaranjani",0,337,337,337],["Shree Manoranjani",0,0,338,338],["Shree ranjani",0,339,339,339],["Siddhasena",0,0,340,340],["Suddha Bhairavi",0,0,341,341],["Shuddha Dhanyasi",0,342,343,344],["Suddha Dhanyāsi",0,342,343,344],["Suddha Dhanyasi",0,342,343,344],["Suddha Hindolam",0,0,345,345],["Suddha Velāvali",0,0,346,347],["Suddha Velavali",0,0,346,347],["Swarabhooshani",0,0,348,348],["Swararanjani",0,0,349,349],["Vajrakānti",0,0,350,351],["Vajrakanti",0,0,350,351],["Gourimanohari",352,352,353,353],["Gowri Manohari",352,352,353,353],["Gowrivelāvali",0,0,354,355],["Gowrivelavali",0,0,354,355],["Hamsadeepika",0,0,356,356],["Lavanthika",0,0,357,357],["Vasantashree (Amba Manohari)",0,0,358,358],["Varunapriya",359,359,359,359],["Veeravasantham",0,0,360,360],["Mararanjani",361,361,362,361],["Māraranjani",361,361,362,361],["Sharāvathi",0,0,363,364],["Sharavathi",0,0,363,364],["Jana Sammodhini",0,0,365,365],["Rājathilaka",0,0,366,367],["Rajathilaka",0,0,366,367],["Charukesi",368,368,369,370],["Chārukeshi",368,368,369,370],["Charukeshi",368,368,369,370],["Tarangini",0,0,371,371],["Māravi",0,0,372,373],["Maravi",0,0,372,373],["Shiva Manohari",0,0,374,374],["Sarasangi",375,375,376,375],["Sarasāngi",375,375,376,375],["Sowrasenā",0,0,377,378],["Sowrasena",0,0,377,378],["Kamalā Manohari",0,0,379,380],["Kamala Manohari",0,0,379,380],["Nalinakānthi",0,0,381,382],["Nalinakanthi",0,0,381,382],["Salavi",0,0,383,383],["Saraseeruha",0,0,384,384],["Surasena",0,0,385,385],["Vasanthi",0,0,386,386],["Harikambhoji",387,387,388,387],["Harikāmbhoji",387,387,388,387],["Harikedāragowla",0,0,389,390],["Harikedaragowla",0,0,389,390],["Ambhojini",0,0,391,391],["Aparoopam",0,0,392,392],["Bahudāri",0,0,393,394],["Bahudari",0,0,393,394],["Chāyalagakhamās",0,0,395,396],["Chayalagakhamas",0,0,395,396],["Chandrahasitham",0,0,397,397],["Dayaranjani",0,0,398,398],["Deshākshi",0,0,399,400],["Deshakshi",0,0,399,400],["Dwaithachintāmani",0,0,401,402],["Dwaithachintamani",0,0,401,402],["Eeshamanohari",0,0,403,403],["Gāndhāralola",0,0,404,405],["Gandharalola",0,0,404,405],["Guhamanohari",0,0,406,406],["Hamsaroopini",0,0,407,407],["Harikedāram",0,0,408,409],["Harikedaram",0,0,408,409],["Harithapriya",0,0,410,410],["Jaijaivanthi",0,0,411,411],["Jhinjothi",0,0,412,412],["Jujahuli",0,0,413,413],["Kambhoji",0,414,415,414],["Kāmbhoji",0,414,415,414],["Kāpi Nārāyani",0,0,416,417],["Kapi Narayani",0,0,416,417],["Karnātaka Behāg",0,0,418,419],["Karnataka Behag",0,0,418,419],["Karnātaka Khamās",0,0,420,421],["Karnataka Khamas",0,0,420,421],["Keshavapriyā",0,0,422,423],["Keshavapriya",0,0,422,423],["Kokilavarāli",0,0,424,425],["Kokilavarali",0,0,424,425],["Mālavi",0,0,426,427],["Malavi",0,0,426,427],["Mahathi",0,0,428,428],["Manoharam",0,0,429,429],["Meghana",0,0,430,430],["Mohanam",0,431,431,431],["Nādavalli",0,0,432,433],["Nadavalli",0,0,432,433],["Nagasvaravali",0,434,435,436],["Nāgaswarāvali",0,434,435,436],["Nagaswaravali",0,434,435,436],["Nārāyana Gowla",0,0,437,438],["Narayana Gowla",0,0,437,438],["Nāttai Kurinji",0,0,439,440],["Nattai Kurinji",0,0,439,440],["Nandhkowns",0,0,441,441],["Navarasa Kalānidhi",0,0,442,443],["Navarasa Kalanidhi",0,0,442,443],["Neela",0,0,444,444],["Parameshwarapriyā",0,0,445,446],["Parameshwarapriya",0,0,445,446],["Poornakāmbhoji",0,0,447,448],["Poornakambhoji",0,0,447,448],["Pratāpavarāli",0,0,449,450],["Pratapavarali",0,0,449,450],["Rāgapanjaramu",0,0,451,452],["Ragapanjaramu",0,0,451,452],["Rāgeshree",0,0,453,454],["Rageshree",0,0,453,454],["Sāvithri",0,0,455,456],["Savithri",0,0,455,456],["Sahana (raga)",0,457,458,459],["Sahāna",0,457,458,459],["Sahana",0,457,458,459],["Saraswathi Manohari",0,0,460,460],["Shakunthala",0,0,461,461],["Shenchukāmbhoji",0,0,462,463],["Shenchukambhoji",0,0,462,463],["Shiva Kāmbhoji",0,0,464,465],["Shiva Kambhoji",0,0,464,465],["Shyāmā",0,0,466,467],["Shyama",0,0,466,467],["Sindhu Kannada",0,0,468,468],["Suddha Khamās",0,0,469,470],["Suddha Khamas",0,0,469,470],["Suddha",0,0,471,471],["Sumanapriyā",0,0,472,473],["Sumanapriya",0,0,472,473],["Suvarnakriyā",0,0,474,475],["Suvarnakriya",0,0,474,475],["Swaravedi",0,0,476,476],["Thilang",0,0,477,477],["Vaishnavi",0,0,478,478],["Vivardhani",0,0,479,479],["Dheerasankarabharanam",480,480,481,482],["Dheera Shankarābharanam",480,480,481,482],["Dheera Shankarabharanam",480,480,481,482],["Ānandharoopa",0,0,483,483],["Arabhi",0,484,485,485],["Ārabi",0,484,485,485],["[[Atana|Atāna]]",0,0,486,487],["[[Atana|Atana]]",0,0,486,487],["Begada",0,0,488,488],["BehāgDeshikam",0,0,489,490],["BehagDeshikam",0,0,489,490],["Bilahari",0,491,491,491],["Buddhamanohari",0,0,492,492],["Chāyā",0,0,493,494],["Chaya",0,0,493,494],["Devagandhari#InCarnatic music",0,495,496,497],["Devagāndhāri",0,495,496,497],["Devagandhari",0,495,496,497],["Dhurvanki",0,0,498,498],["Garudadhvani",0,0,499,499],["Hamsadhwani",0,500,500,500],["Hemant",0,0,501,501],["Janaranjani",0,0,502,502],["Kamaripriyā",0,0,503,504],["Kamaripriya",0,0,503,504],["Kathanakuthoohalam",0,0,505,505],["Kokilabhāshani",0,0,506,507],["Kokilabhashani",0,0,506,507],["Kurinji",0,0,508,508],["Kutuhala",0,0,509,509],["Mānd",0,0,510,511],["Mand",0,0,510,511],["Mohanadhwani",0,0,512,512],["Nāgadhwani",0,0,513,514],["Nagadhwani",0,0,513,514],["Navaroj",0,0,515,515],["Niroshta",0,516,516,516],["Poornachandrikā",0,0,517,518],["Poornachandrika",0,0,517,518],["Poorvagowla",0,0,519,519],["Reetuvilāsa",0,0,520,521],["Reetuvilasa",0,0,520,521],["Shankara",0,0,522,522],["Shankaramohana",0,0,523,523],["Sindhu",0,0,524,524],["Suddha Mālavi",0,0,525,526],["Suddha Malavi",0,0,525,526],["Shuddha Saveri",0,527,528,529],["Suddha Sāveri",0,527,528,529],["Suddha Saveri",0,527,528,529],["Suranandini",0,0,530,530],["Tāndavam",0,0,531,532],["Tandavam",0,0,531,532],["Vasanthamalai",0,0,533,533],["Veerapratāpa",0,0,534,535],["Veerapratapa",0,0,534,535],["Naganandini",536,536,537,538],["Nāganandhini",536,536,537,538],["Naganandhini",536,536,537,538],["Nāgabharanam",0,0,539,540],["Nagabharanam",0,0,539,540],["Lalithagāndharva",0,0,541,542],["Lalithagandharva",0,0,541,542],["Yagapriya",543,543,544,543],["Yāgapriyā",543,543,544,543],["Kalāvathi",0,0,545,546],["Kalavathi",0,0,545,546],["Desharanjani",0,0,547,547],["Gānavaridhi",0,0,548,549],["Ganavaridhi",0,0,548,549],["Niranjani",0,0,550,550],["Ragavardhini",551,551,552,553],["Rāgavardhani",551,551,552,553],["Ragavardhani",551,551,552,553],["Rāgachoodāmani",0,0,554,555],["Ragachoodamani",0,0,554,555],["Dhowmya",0,0,556,556],["Hindoladarbār",0,0,557,558],["Hindoladarbar",0,0,557,558],["Sāmantajingala",0,0,559,560],["Samantajingala",0,0,559,560],["Gangeyabhusani",561,562,562,562],["Gangeyabhushani",561,562,562,562],["Gangātarangini",0,0,563,564],["Gangatarangini",0,0,563,564],["Vagadheeswari",565,565,566,567],["Vāgadeeshwari",565,565,566,567],["Vagadeeshwari",565,565,566,567],["Bhogachāyā Nāttai",0,0,568,569],["Bhogachaya Nattai",0,0,568,569],["Chāyanāttai",0,0,570,571],["Chayanattai",0,0,570,571],["Mohanāngi",0,0,572,573],["Mohanangi",0,0,572,573],["Sharadabharana",0,0,574,574],["Shoolini",575,576,576,576],["Shulini",575,576,576,576],["Shailadeshākshhi",0,0,577,578],["Shailadeshakshhi",0,0,577,578],["Shokavarāli",0,0,579,580],["Shokavarali",0,0,579,580],["Chalanata",581,581,582,583],["Chalanāttai",581,581,582,583],["Chalanattai",581,581,582,583],["Devanāttai",0,0,584,585],["Devanattai",0,0,584,585],["Gambhiranata",0,586,587,588],["Gambheeranāttai",0,586,587,588],["Gambheeranattai",0,586,587,588],["Ganaranjani",0,0,589,589],["Salagam",590,590,591,590],["Sālagam",590,590,591,590],["Sowgandhini",0,0,592,592],["Jalarnavam",593,593,594,593],["Jalārnavam",593,593,594,593],["Jaganmohinam",0,0,595,595],["Jhalavarali",596,596,597,596],["Jhālavarāli",596,596,597,596],["Dhālivarāli",0,0,598,599],["Dhalivarali",0,0,598,599],["Godari",0,0,600,600],["Janāvali",0,0,601,602],["Janavali",0,0,601,602],["Kokilapanchamam",0,0,603,603],["Navaneetam",604,604,605,605],["Navaneetham",604,604,605,605],["Nabhomani",0,0,606,606],["Pavani",607,608,609,607],["Pavani (ragam)",607,608,609,607],["Pāvani",607,608,609,607],["Kumbhini",0,0,610,610],["Prabhāvali",0,0,611,612],["Prabhavali",0,0,611,612],["Poornapanchamam",0,0,613,613],["Raghupriya",614,614,614,614],["Ravi Kriyā",0,0,615,616],["Ravi Kriya",0,0,615,616],["Gomathi",0,0,617,617],["Gavambodhi",618,619,620,621],["Gavambhodi",618,619,620,621],["Ghavāmbhodi",618,619,620,621],["Ghavambhodi",618,619,620,621],["Keervāni",0,0,622,623],["Keervani",0,0,622,623],["Suvarnadeepakam",0,0,624,624],["Bhavapriya",625,625,625,625],["Bhavāni",0,0,626,627],["Bhavani",0,0,626,627],["Subhapantuvarali",628,629,630,631],["Shubhapantuvarali",628,629,630,631],["Shubhapanthuvarāli",628,629,630,631],["Shubhapanthuvarali",628,629,630,631],["Shivapanthuvarāli",0,0,632,633],["Shivapanthuvarali",0,0,632,633],["Bandhuvarāli",0,0,634,635],["Bandhuvarali",0,0,634,635],["Bhānukeeravāni",0,0,636,637],["Bhanukeeravani",0,0,636,637],["Dhowreyani",0,0,638,638],["Jālakesari",0,0,639,640],["Jalakesari",0,0,639,640],["Mahānandhini",0,0,641,642],["Mahanandhini",0,0,641,642],["Shekharachandrikā",0,0,643,644],["Shekharachandrika",0,0,643,644],["Shadvidhamargini",645,646,647,645],["Shadvidamargini",645,646,647,645],["Shadvidhamārgini",645,646,647,645],["Sthavarājam",0,0,648,649],["Sthavarajam",0,0,648,649],["Indhudhanyāsi",0,0,650,651],["Indhudhanyasi",0,0,650,651],["Teevravāhini",0,0,652,653],["Teevravahini",0,0,652,653],["Suvarnangi",654,654,655,654],["Suvarnāngi",654,654,655,654],["Sowveeram",0,0,656,656],["Rathikā",0,0,657,658],["Rathika",0,0,657,658],["Divyamani",659,659,659,659],["Jeevanthikā",0,0,660,661],["Jeevanthika",0,0,660,661],["Dundubi",0,0,662,662],["Suddha Gāndhāri",0,0,663,664],["Suddha Gandhari",0,0,663,664],["Dhavalambari",665,665,666,665],["Dhavalāmbari",665,665,666,665],["Dhavalāngam",0,0,667,668],["Dhavalangam",0,0,667,668],["Bhinnapauarali",0,0,669,669],["Sudharmini",0,0,670,670],["Namanarayani",671,671,672,671],["Nāmanārāyani",671,671,672,671],["Nāmadeshi",0,0,673,674],["Namadeshi",0,0,673,674],["Narmada",0,0,675,675],["Kamavardhini",676,676,677,678],["Panthuvarāli (Kāmavardhani)",676,676,677,678],["Panthuvarali (Kamavardhani)",676,676,677,678],["Kāshirāmakriyā",0,0,679,680],["Kashiramakriya",0,0,679,680],["Deepakam",0,0,681,681],["Gamanapriyā",0,0,682,683],["Gamanapriya",0,0,682,683],["Indumathi",0,0,684,684],["Kumudhakriyā",0,0,685,686],["Kumudhakriya",0,0,685,686],["Ponni",0,0,687,687],["Puriyadhanashree",0,0,688,688],["Ramapriya",689,689,690,689],["Rāmapriyā",689,689,690,689],["Ramāmanohari",0,0,691,692],["Ramamanohari",0,0,691,692],["Hamsagamini",0,0,693,693],["Meghashyāmala",0,0,694,695],["Meghashyamala",0,0,694,695],["Raktimārgini",0,0,696,697],["Raktimargini",0,0,696,697],["Reethi Chandrikā",0,0,698,699],["Reethi Chandrika",0,0,698,699],["Sukhakari",0,0,700,700],["Gamanasrama",701,702,702,702],["Gamanashrama",701,702,702,702],["Gamakakriyā",0,0,703,704],["Gamakakriya",0,0,703,704],["Bhatiyār",0,0,705,706],["Bhatiyar",0,0,705,706],["Hamsānandi",0,0,707,708],["Hamsanandi",0,0,707,708],["Padmakalyāni",0,0,709,710],["Padmakalyani",0,0,709,710],["Sharabadhvāja",0,0,711,712],["Sharabadhvaja",0,0,711,712],["Sohini",0,713,713,713],["Vaishaka",0,0,714,714],["Viswambari",715,716,717,718],["Vishwambari",715,716,717,718],["Vishvāmbhari",715,716,717,718],["Vishvambhari",715,716,717,718],["Vamshavathi",0,0,719,719],["Pooshakalyāni",0,0,720,721],["Pooshakalyani",0,0,720,721],["Suddhakriyā",0,0,722,723],["Suddhakriya",0,0,722,723],["Vijayavasantham",0,0,724,724],["Syamalangi",725,726,727,728],["Shamalangi",725,726,727,728],["Shyāmalāngi",725,726,727,728],["Shyamalangi",725,726,727,728],["Shyāmalam",0,0,729,730],["Shyamalam",0,0,729,730],["Vijayamālavi",0,0,731,732],["Vijayamalavi",0,0,731,732],["Shanmukhapriya",733,733,733,733],["Chāmaram",0,0,734,735],["Chamaram",0,0,734,735],["Chintāmani",0,0,736,737],["Chintamani",0,0,736,737],["Garigadya",0,0,738,738],["Kokilanandhi",0,0,739,739],["Samudrapriyā",0,0,740,741],["Samudrapriya",0,0,740,741],["Sumanesharanjani",0,0,742,742],["Simhendramadhyamam",743,743,744,744],["Simhendra Madhyamam",743,743,744,744],["Sumadyuthi",0,0,745,745],["Ghantana",0,0,746,746],["Pranavapriyā",0,0,747,748],["Pranavapriya",0,0,747,748],["Seshanādam",0,0,749,750],["Seshanadam",0,0,749,750],["Sunādapriyā",0,0,751,752],["Sunadapriya",0,0,751,752],["Vijayasaraswathi",0,0,753,753],["Hemavati",754,755,756,756],["Hemavati (ragam)",754,755,756,756],["Hemavathi",754,755,756,756],["Deshisimhāravam",0,0,757,758],["Deshisimharavam",0,0,757,758],["Hamsabhramari",0,0,759,759],["Hemapriya",0,0,760,760],["Madhukowns",0,0,761,761],["Simhārava",0,0,762,763],["Simharava",0,0,762,763],["Vijayashrāngi",0,0,764,765],["Vijayashrangi",0,0,764,765],["Dharmavati",766,766,767,767],["Dharmavathi",766,766,767,767],["Dhāmavathi",0,0,768,769],["Dhamavathi",0,0,768,769],["Karmukhāvati",0,0,770,771],["Karmukhavati",0,0,770,771],["Lalitasimharavam",0,0,772,772],["Madhuvanti",0,773,774,774],["Madhuvanthi",0,773,774,774],["Ranjani",0,0,775,775],["Vijayanāgari",0,0,776,777],["Vijayanagari",0,0,776,777],["Neetimati",778,778,779,779],["Neethimathi",778,778,779,779],["Nisshadham",0,0,780,780],["Deshyagānavaridhi",0,0,781,782],["Deshyaganavaridhi",0,0,781,782],["Kaikavashi",0,0,783,783],["Rathnasāranga",0,0,784,785],["Rathnasaranga",0,0,784,785],["Kantamani",786,786,787,788],["Kānthāmani",786,786,787,788],["Kanthamani",786,786,787,788],["Kunthalam",0,0,789,789],["Shruthiranjani",0,0,790,790],["Rishabhapriya",791,791,791,791],["Rathipriyā",0,0,792,793],["Rathipriya",0,0,792,793],["Poornasāveri",0,0,794,795],["Poornasaveri",0,0,794,795],["Suddha Sāranga",0,0,796,797],["Suddha Saranga",0,0,796,797],["Latangi",798,798,799,800],["Lathāngi",798,798,799,800],["Lathangi",798,798,799,800],["Geethapriyā",0,0,801,802],["Geethapriya",0,0,801,802],["Hamsalatha",0,0,803,803],["Karunākari",0,0,804,805],["Karunakari",0,0,804,805],["Ramani",0,0,806,806],["Raviswaroopini",0,0,807,807],["Skandamanorama",0,0,808,808],["Vachaspati",809,810,811,812],["Vachaspati (ragam)",809,810,811,812],["Vāchaspathi",809,810,811,812],["Vachaspathi",809,810,811,812],["Bhooshāvathi",0,0,813,814],["Bhooshavathi",0,0,813,814],["Bhogeeshwari",0,0,815,815],["Dwigāndhārabhooshani",0,0,816,817],["Dwigandharabhooshani",0,0,816,817],["Gurupriya",0,0,818,818],["Mangalakari",0,0,819,819],["Nādhabrahma",0,0,820,821],["Nadhabrahma",0,0,820,821],["Saraswathi",0,0,822,822],["Utthari",0,0,823,823],["Mechakalyani",824,825,826,824],["Kalyani (rāga)",824,825,826,824],["Mechakalyāni",824,825,826,824],["Shānthakalyāni",0,0,827,828],["Shanthakalyani",0,0,827,828],["Aprameya",0,0,829,829],["Chandrakāntha",0,0,830,831],["Chandrakantha",0,0,830,831],["HameerKalyāni",0,0,832,833],["HameerKalyani",0,0,832,833],["Kalyānadāyini",0,0,834,835],["Kalyanadayini",0,0,834,835],["Kowmoda",0,0,836,836],["Mohanakalyani",0,837,838,839],["Mohana Kalyāni",0,837,838,839],["Mohana Kalyani",0,837,838,839],["Nādhakalyāni",0,0,840,841],["Nadhakalyani",0,0,840,841],["Sāranga",0,0,842,843],["Saranga",0,0,842,843],["Shilangi",0,0,844,844],["Sunadavinodini",0,845,846,845],["Sunādavinodini",0,845,846,845],["Vandanadhārini",0,0,847,848],["Vandanadharini",0,0,847,848],["YamanKalyāni",0,0,849,850],["YamanKalyani",0,0,849,850],["Chitrambari",851,851,852,851],["Chitrāmbari",851,851,852,851],["Chaturāngini",0,0,853,854],["Chaturangini",0,0,853,854],["Amritavarshini",0,855,855,855],["Chitrasindhu",0,0,856,856],["Vijayakoshalam",0,0,857,857],["Sucharitra",858,858,858,858],["Santhāna Manjari",0,0,859,860],["Santhana Manjari",0,0,859,860],["Jyotiswarupini",861,862,863,863],["Jyoti swarupini",861,862,863,863],["Jyothiswaroopini",861,862,863,863],["Jyothi",0,0,864,864],["Jyothishmathi",0,0,865,865],["Dhatuvardhini",866,867,868,869],["Dhatuvardani",866,867,868,869],["Dhātuvardhani",866,867,868,869],["Dhatuvardhani",866,867,868,869],["Dhowtha Panchamam",0,0,870,870],["Sumukham",0,0,871,871],["Nasikabhusani",872,873,874,875],["Nasikabhushani",872,873,874,875],["Nāsikabhooshhani",872,873,874,875],["Nasikabhooshhani",872,873,874,875],["Nāsāmani",0,0,876,877],["Nasamani",0,0,876,877],["Thilakamandāri",0,0,878,879],["Thilakamandari",0,0,878,879],["Kosalam",880,880,880,880],["Kusumākaram",0,0,881,882],["Kusumakaram",0,0,881,882],["Rasikapriya",883,883,883,883],["Rasamanjari",0,0,884,884],["Ishtārangini",0,0,885,886],["Ishtarangini",0,0,885,886]];


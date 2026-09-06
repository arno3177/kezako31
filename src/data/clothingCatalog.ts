// src/data/clothingCatalog.ts

export interface ClothingCatalogItem {
  tops: string[];
  bottoms: string[];
  outerwear: string[];
  shoes: string[];
  accessories: string[];
}

export const clothingCatalog: Record<'male' | 'female' | 'kids' | 'sport', ClothingCatalogItem> = {
  male: {
    tops: [
      "Chemise oxford en coton bio", "Polo manches longues ajusté en mérinos", "Chemise casual en lin lavé", 
      "Pull léger en maille fine de coton", "Chemise habillée en popeline stretch", "Polo en maille piquée italienne",
      "Sur-chemise épaisse en flanelle à carreaux", "Chemise en denim brut délavé", "Pull col V en mérinos doux",
      "T-shirt manches longues basique en coton", "Chemise en chambray léger", "Polo sport-chic zippé",
      "Pull zippé col montant en coton", "Chemise col mao en lin et coton", "Sweat-shirt minimaliste uni molletonné",
      "Chemise de ville à rayures verticales", "Sur-chemise style worker en twill", "Pull col châle en grosse maille",
      "T-shirt manches longues à poche plaquée", "Polo à manches longues en jersey", "Chemise hawaïenne subtile en viscose",
      "Pull col rond texturé en coton", "Sur-chemise en suédine légère", "Chemise casual en twill brossé",
      "Pull fin col roulé en mérinos", "T-shirt loose en coton lourd", "Chemise de ville slim fit unie",
      "Polo col officier minimaliste", "Sweat texturé à structure gaufrée", "Sur-chemise en lin mélangé",
      "Chemise oxford à col boutonné", "Pull sans manches en maille", "T-shirt manches longues chiné",
      "Chemise habillée en popeline de soie", "Polo manches courtes en maille", "Sweat-shirt à capuche zippé casual",
      "Chemise casual à rayures bayadères", "Pull léger col cheminée", "T-shirt basique en coton peigné", "Sur-chemise en velours côtelé fin"
    ],
    bottoms: [
      "Pantalon chino slim beige sable", "Jean brut selvedge coupe droite", "Pantalon de ville en twill de coton",
      "Jean slim noir délavé intemporel", "Pantalon cargo urbain en coton stretch", "Pantalon en velours côtelé marron glacé",
      "Pantalon de costume casual assorti", "Jean brut stretch regular", "Pantalon chino bleu marine élégant",
      "Jean clair effet usé soigné", "Pantalon habillé en flanelle légère", "Pantalon en toile épaisse structurée",
      "Pantalon chino kaki coupe ajustée", "Jean gris anthracite brut", "Pantalon de jogging urbain fuselé",
      "Pantalon tailleur en lin et coton", "Jean brut coupe slim stretch", "Pantalon cargo minimaliste noir",
      "Pantalon en twill à pinces souple", "Jean bleu brume délavé", "Pantalon de ville en coton brossé",
      "Chino coupe droite brique", "Jean brut selvedge loose", "Pantalon de survêtement chic en molleton",
      "Pantalon en velours côtelé olive", "Jean noir enduit aspect cuir", "Pantalon chino gris perle",
      "Pantalon de ville en lin mélangé", "Jean brut coupe tapered", "Pantalon cargo en toile technique"
    ],
    outerwear: [
      "Blouson type Harrington intemporel", "Veste de mi-saison style surchemise épaisse", "Trench court ou blazer casual structuré",
      "Manteau long droit en drap de laine", "Veste en jean brut trucker classique", "Parka urbaine imperméable doublée",
      "Blazer casual en coton texturé", "Veste en cuir style motard épuré", "Caban double boutonnage classique", "Veste matelassée légère losange"
    ],
    shoes: [
      "Sneakers en cuir épurées blanches", "Derbies citadines en cuir ciré marron", "Bottines Chelsea en cuir souple noir",
      "Baskets basses en toile rétro", "Richelieus modernes en cuir de veau", "Sneakers montantes minimalistes en cuir",
      "Mocassins casual en suédine", "Bottines workwear à lacets résistantes", "Sneakers minimalistes noires en cuir", "Chaussures bateaux en cuir ciré"
    ],
    accessories: [
      "Sacoche fine en cuir véritable", "Montre bracelet classique en acier", "Parapluie compact anti-tempête robuste",
      "Ceinture en cuir assortie aux chaussures", "Lunettes de soleil aviateur polarisées", "Porte-documents professionnel en cuir",
      "Casquette casual élégante en coton", "Cache-nez en cachemire doux", "Sac à dos citadin en cuir mat", "Étui à lunettes rigide",
      "Sac de voyage week-end en toile et cuir", "Écharpe légère en lin et coton", "Porte-cartes minimaliste en cuir", "Ceinture tressée élastique", "Kit quotidien complet"
    ]
  },

  female: {
    tops: [
      "Chemisier fluide en soie pure", "Pull fin en cachemire col V", "Blouse élégante à motifs botaniques",
      "Chemise blanche oversize en popeline", "Top en satin à fines bretelles", "Pull col roulé moulant en mérinos",
      "Chemisier col lavallière sophistiqué", "Top asymétrique élégant", "Chemise en lin chic et aérien",
      "Pull loose en mohair tout doux", "Blouse romantique en dentelle fine", "Top côtelé près du corps",
      "Chemise fluide nouée à la taille", "Cardigan court boutonné en maille", "Top chic en jersey de soie",
      "Blouse à volants discrets", "Pull fin col bateau rayé", "Chemise cintrée en popeline stretch",
      "Top asymétrique en satin", "Gilet long fluide en maille", "Blouse boho chic en broderie anglaise",
      "Pull col rond en cachemire mélangé", "Top sans manches en lin lavé", "Chemisier cache-cœur élégant",
      "Pull léger ajouré", "Top droit minimaliste en satin", "Chemise fluide imprimé graphique",
      "Cardigan court style vintage", "Top bustier structuré", "Blouse en mousseline vaporeuse",
      "Chemise ample en tencel", "Pull fin à col cheminée", "Top texturé côtelé",
      "Chemisier col tunisien en lin", "Cardigan long oversize en mohair", "Top chic en satin mat",
      "Blouse plissée élégante", "Pull loose col V profond", "Top basique en coton pima", "Chemisier à jabot moderne",
      "Body élégant à manches longues", "Chemise longue style boyfriend", "Top péplum structuré",
      "Cardigan bouton-bijou en maille fine", "Blouse cache-cœur en mousseline", "Top asymétrique drapé",
      "Chemisier en mousseline plissée", "Pull crop top en maille douce", "Chemise en soie imprimé léopard",
      "Top minimaliste en lin et coton", "Blouse style victorien revisitée", "Cardigan enveloppant noué",
      "Top à bretelles larges en coton bio", "Chemise droite en popeline rayée", "Pull col cheminée en cachemire",
      "Blouse transparente à pois délicats", "Top bustier en lin froissé", "Chemise en satin duchesse",
      "Cardigan court oversize", "Top côtelé zippé sur le devant"
    ],
    bottoms: [
      "Pantalon cigarette coupe 7/8 élégant", "Jean flare stretch brut longueur cheville", "Jupe midi plissée fluide",
      "Pantalon palazzo fluide taille haute", "Jean slim brut délavé intemporel", "Pantalon chino ajusté chic",
      "Jupe crayon en simili cuir souple", "Pantalon large en twill de coton", "Jean mom fit taille haute confortable",
      "Pantalon tailleur à pinces élégant", "Jupe longue trapèze en maille", "Jean boyfriend décontracté mais soigné",
      "Pantalon 7/8 à carreaux discrets", "Jupe plissée en velours ras", "Pantalon droit fluide en crêpe",
      "Pantalon large en lin naturel", "Jean flare effet used", "Jupe portefeuille midi en lin",
      "Pantalon tailleur cigarette 7/8", "Jean slim noir enduit", "Jupe longue fluide imprimée",
      "Pantalon palazzo en satin mat", "Jean droit brut selvedge", "Jupe-culotte taille haute",
      "Pantalon fluide à cordon de serrage", "Jean skinny stretch confort", "Jupe trapèze en jean",
      "Pantalon large en twill léger", "Jean boyfriend délavé clair", "Pantalon cigarette en velours côtelé fin",
      "Pantalon flare taille haute en crêpe", "Jupe portefeuille asymétrique", "Pantalon large en satin fluide",
      "Jean droit délavé vintage", "Jupe longue plissée soleil", "Pantalon chino ample style relaxed",
      "Jean wide leg brut taille haute", "Jupe midi trapèze en suédine", "Pantalon cigarette à carreaux prince-de-galles",
      "Jean slim gris effet usé", "Pantalon sarouel chic en lin", "Jupe courte évasée en tweed",
      "Pantalon droit en velours milleraies", "Jean mom stretch délavé clair", "Pantalon tailleur oversize",
      "Jupe midi portefeuille en satin", "Pantalon fluide imprimé léopard", "Jean flare blanc cassé",
      "Pantalon cargo chic en toile souple", "Jupe crayon longue fendue"
    ],
    outerwear: [
      "Trench-coat classique beige ou marine", "Blazer structuré chic mi-saison", "Veste courte en suédine douce",
      "Manteau long en drap de laine ceinturé", "Veste en jean brut cintrée style urbain", "Parka chic doublée à capuche bordée",
      "Blazer oversize à carreaux style boyfriend", "Veste perfecto en cuir souple", "Manteau droit minimaliste en laine bouillie", "Veste matelassée légère et élégante",
      "Trench court ceinturé style citadin", "Blazer long fluide non doublé", "Veste style tweed chic et intemporelle", "Manteau cape élégant et chaud", "Veste mi-saison zippée à col montant",
      "Blouson aviateur oversize en nylon", "Manteau droit en fausse fourrure douce", "Veste sans manches longue en drap de laine", "Surchemise épaisse à carreaux mode", "Blazer cintré en velours côtelé"
    ],
    shoes: [
      "Mocassins en cuir souple à mors doré", "Bottines citadines à talons carrés confortables", "Sneakers blanches minimalistes en cuir",
      "Escarpins classiques à petits talons", "Bottines Chelsea plates en cuir ciré", "Mocassins chunky à semelle crantée",
      "Baskets habillées de détails dorés", "Bottines montantes à lacets style vintage", "Ballerines élégantes en cuir souple", "Derbies vernies brillantes",
      "Mocassins souples en suédine", "Baskets en toile chic à plateforme", "Bottines d'hiver fourrées élégantes", "Escarpins pointus à talon aiguille", "Sandales à talons hauts et brides fines",
      "Mules plates en cuir tressé", "Bottines chaussettes stretch ajustées", "Baskets rétro colorées en suédine", "Bottes hautes cavalières en cuir", "Espadrilles compensées élégantes"
    ],
    accessories: [
      "Foulard en soie coloré", "Sac cabas en cuir souple", "Écharpe légère élégante",
      "Parapluie de poche compact", "Sac à main structuré chic", "Lunettes de soleil solaires",
      "Ceinture fine en cuir", "Bijoux dorés discrets", "Chapeau feutré élégant", "Gants en cuir fin",
      "Sac à bandoulière tendance", "Pashmina doux en cachemire", "Porte-cartes assorti", "Bérêt en laine chic", "Sac seau en cuir",
      "Grand cabas en osier", "Chapeau panama de paille", "Ceinture large corset en cuir", "Pochette de soirée en satin", "Sautoir doré minimaliste",
      "Créoles dorées texturées", "Bandeau à cheveux en soie", "Étui à lunettes chic", "Chouchou en satin volumineux", "Kit complet élégance"
    ]
  },

  kids: {
    tops: [
      "T-shirt manches longues en coton bio", "Sweat molletonné coloré à motifs", "Cardigan zippé confortable en coton", "Pull en maille douce anti-grattage", "Sous-pull thermique moulant",
      "T-shirt bio respirant pour l'école", "Sweat à capuche molletonné avec poches", "Pull col roulé fin extensible", "Sur-chemise en flanelle à carreaux", "Gilet polaire léger zippé",
      "T-shirt graphique ludique", "Sweat shirt bicolore tendance", "Pull en tricot léger ajouré", "Chemise en denim souple et léger", "T-shirt rayé style marin",
      "T-shirt basique uni en coton peigné", "Sweat shirt oversize confortable", "Cardigan boutonné en maille fine", "Pull à col rond avec patchs coudières", "T-shirt manches longues à col tunisien",
      "Haut thermique de sport pour enfants", "Gilet sans manches matelassé léger", "Sweat shirt zippé à col montant", "T-shirt en coton bio à message amusant", "Pull douillet à grosses mailles souples"
    ],
    bottoms: [
      "Jean stretch souple et résistant", "Pantalon en toile doublé pour la cour", "Pantalon de survêtement molletonné confortable", "Jean brut élastique avec taille ajustable", "Pantalon cargo multipoches en coton",
      "Legging épais et renforcé aux genoux", "Pantalon de pluie déperlant à bretelles", "Sur-pantalon de neige imperméable", "Short en toile légère avec cordon", "Pantacourt souple en coton",
      "Jean slim lavable et ultra-souple", "Pantalon en velours côtelé doux", "Jogging fuselé avec revers", "Jean noir délavé extensible", "Pantalon de toile résistant spécial école",
      "Legging thermique molletonné", "Pantalon de survêtement technique stretch", "Jean loose fit confortable pour jouer", "Pantalon chino souple avec taille élastique", "Short de sport léger en mesh"
    ],
    outerwear: [
      "Veste de mi-saison coupe-vent à capuche", "Blouson imperméable léger et coloré", "Parka souple résistante aux averses", "Doudoune sans manches matelassée", "Veste en jean doublée style teddy",
      "Manteau court à capuche imperméable", "Veste softshell zippée déperlante", "Blouson aviateur doublé pour enfants", "Manteau chaud d'hiver isolant", "Cape de pluie colorée avec visière",
      "Parka longue grand froid avec fausse fourrure", "Veste polaire épaisse à zip intégral", "Anorak coupe-vent pliable de poche", "Manteau mi-long étanche et chaud", "Veste de sport matelassée légère"
    ],
    shoes: [
      "Baskets robustes à scratchs et semelle crantée", "Chaussures montantes de sport confortables", "Baskets étanches pour sols humides", "Bottes de pluie en caoutchouc souple", "Bottes de neige fourrées en laine",
      "Sandales de marche aérées avec scratch", "Baskets en toile légère respirante", "Chaussures de marche stables et souples", "Bottes fourrées étanches anti-froid", "Sneakers urbaines résistantes",
      "Baskets de course souples pour enfants", "Chaussures basses renforcées au bout", "Bottes de pluie montantes antidérapantes", "Baskets montantes stylées pour l'école", "Chaussures légères de cour de récréation"
    ],
    accessories: [
      "Sac à dos ergonomique avec gourde", "Casquette de sport anti-UV réglable", "Bonnet en laine douce et chaude", "Écharpe tubulaire polaire", "Gants de ski imperméables et isolants",
      "Parapluie transparent solide pour enfants", "Tour de cou polaire ajustable", "Lunettes de soleil solaires enfants", "Sac étanche pour affaires de rechange", "Bandeau sportif absorbant",
      "Sac à goûter isotherme assorti", "Gants magiques extensibles colorés", "Housse de imperméable pour sac à dos", "Chapeau bob anti-UV de plage", "Kit pluie enfant complet (cape + parapluie)"
    ]
  },

  sport: {
    tops: [
      "Maillot technique à manches longues respirant", "T-shirt de running anti-transpiration", "Top de compression thermique léger", 
      "Débardeur de sport ultra-léger aéré", "Maillot de training à séchage rapide", "Veste de running zippée mi-zipp", 
      "T-shirt technique chiné stretch", "Top thermique à col zippé", "Maillot de sport sans coutures (seamless)", 
      "T-shirt de fitness léger et extensible", "Sous-couche technique moulante manches longues", "Haut de course à manches courtes aéré", 
      "Polo de sport technique respirant", "Débardeur de compression ajusté", "Maillot de training manches longues zippé",
      "Maillot de trail running anti-UV", "Top thermique respirant à col montant", "T-shirt de fitness à séchage instantané",
      "Débardeur large d'entraînement respirant", "Maillot technique de compression pour le haut du corps", "Top de course perforé ultra-ventilé",
      "Maillot de training extensible anti-odeurs", "Haut thermique de sport à manches raglan", "T-shirt de running réfléchissant pour nuit",
      "Débardeur technique avec empiècements en mesh", "Maillot de sport léger à coutures plates", "Top compressif de sport pour maintien musculaire",
      "Maillot technique ample pour training en salle", "T-shirt respirant de cross-training", "Top de sport thermique stretch à manches longues"
    ],
    bottoms: [
      "Legging de sport long et extensible", "Pantalon de jogging fuselé respirant", "Short de course avec collant intégré", 
      "Collant de running thermique compressif et isolant", "Short de training ample et léger", "Pantalon de survêtement technique zippé", 
      "Corsaire de course anti-frottements", "Short 2-en-1 avec poche smartphone", "Legging 7/8 taille haute gainant", 
      "Pantalon de training stretch fuselé", "Short de running ultra-léger fendus", "Collant de compression pour l'effort", 
      "Survêtement de sport ajusté", "Short de sport en matière technique", "Pantalon de jogging molletonné sport",
      "Legging de sport thermique doublé polaire", "Pantalon de ski de fond technique et extensible", "Collant thermique de compression haute isolation",
      "Pantalon de sport hivernal déperlant et doublé", "Legging thermique long avec membrane coupe-vent", "Short de compression court pour running",
      "Pantalon de training technique anti-pluie", "Legging de sport déperlant stretch", "Short de trail avec ceinture de portage",
      "Collant de running taille haute respirant", "Pantalon de jogging ample pour échauffement", "Short de training en tissu stretch 4-way",
      "Legging de sport sans coutures gainant", "Pantalon technique léger pour athlétisme", "Short technique de course multi-poches"
    ],
    outerwear: [
      "Veste coupe-vent ultra-légère déperlante", "Polaire softshell active très respirante", "Sans-manches matelassé coupe-vent", 
      "Veste de running imperméable réfléchissante", "Coupe-vent de course compressible", "Veste thermique active pour temps froid", 
      "Gilet de sport coupe-vent ultra-léger", "Veste softshell doublée polaire fine", "Blouson de sport technique imperméable", 
      "Veste de training zippée à capuche", "Coupe-vent déperlant à zip étanche", "Veste active stretch multi-activités", 
      "Gilet de course réfléchissant et respirant", "Polaire technique légère à col montant", "Veste de sport isolante et légère"
    ],
    shoes: [
      "Chaussures de running à fort amorti", "Chaussures de trail légères multi-terrains", "Sneakers de sport dynamiques et réactives", 
      "Chaussures de course sur route légères", "Baskets d'entraînement à stabilité renforcée", "Chaussures de trail imperméables à gros crampons", 
      "Sneakers de fitness souples et flexibles", "Chaussures de running à plaque carbone", "Baskets de cross-training polyvalentes", 
      "Chaussures de course minimalistes", "Sneakers de running à semelle aerocell", "Chaussures de trail robustes et protectrices", 
      "Baskets d'entraînement indoor à fort grip", "Chaussures de course confort grand fond", "Sneakers de sport légères respirantes"
    ],
    accessories: [
      "Bandeau anti-transpiration", "Gants tactiles thermiques", "Casquette technique anti-UV", "Ceinture d'hydratation", "Gourde isotherme",
      "Brassard smartphone étanche", "Chaussettes de compression", "Lunettes de sport polarisées", "Serviette microfibre compacte", "Sac à dos de trail ergonomique",
      "Chapeau de course respirant", "Gants de running coupe-vent", "Visière de sport anti-transpiration", "Genouillères de maintien sportif", "Sac banane ultra-plat de course",
      "Chaussettes anti-ampoules renforcées", "Gourde souple pliable", "Bandeau polaire pour les oreilles", "Manchons de compression mollets", "Casquette réfléchissante de nuit",
      "Brassard lumineux de sécurité", "Sac de sport étanche pour entraînement", "Écouteurs sans fil de sport", "Ceinture porte-dossard", "Gants de sport grand froid"
    ]
  }
};
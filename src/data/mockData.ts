import { Article, WeatherData } from '../types';

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'La révolution quantique : Comment les nouveaux processeurs redéfinissent l’avenir du calcul',
    excerpt: 'Des laboratoires de recherche aux premières applications industrielles, découvrez comment l’informatique quantique franchit un cap décisif cette année.',
    content: `L'informatique quantique n'est plus seulement une promesse théorique confinée aux laboratoires universitaires. Ces derniers mois, des avancées spectaculaires en matière de correction d'erreurs et de stabilité des qubits ouvrent la voie à des applications commerciales concrètes.

Les géants de la tech ainsi que plusieurs start-ups européennes annoncent des processeurs capables d'exécuter des calculs complexes en quelques secondes, là où les supercalculateurs classiques nécessiteraient des millénaires. De la modélisation moléculaire pour la découverte de nouveaux médicaments à l'optimisation des flux logistiques mondiaux, les répercussions s'annoncent sismiques.

Cependant, de grands défis subsistent, notamment la nécessité de maintenir ces processeurs à des températures proches du zéro absolu et la sécurisation des infrastructures cryptographiques face à la menace de décryptage quantique.`,
    category: 'Technologie',
    source: 'www.franceinfo.fr',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
    author: {
      name: 'Dr. Éléonore Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
    },
    publishedAt: 'Il y a 2 heures',
    readTime: '4 min de lecture',
    likes: 342,
    commentsCount: 28,
    featured: true
  },
  {
    id: '2',
    title: 'Renaissance urbaine : Les métropoles européennes font le pari de la forêt verticale',
    excerpt: 'Face aux îlots de chaleur estivaux, les architectes réinventent le paysage urbain en intégrant des milliers d’espèces végétales au cœur des gratte-ciels.',
    content: `C'est une métamorphose silencieuse mais spectaculaire qui s'opère dans les grandes capitales européennes. Milan, Paris, Berlin... Les centres urbains bétonnés cèdent peu à peu du terrain à une architecture vivante, régénératrice et luxuriante.

La "forêt verticale" n'est plus seulement un manifeste esthétique : c'est une réponse pragmatique et vitale au dérèglement climatique. En absorbant le dioxyde de carbone, en filtrant les particules fines et en abaissant la température ressentie de plusieurs degrés en période de canicule, ces édifices redéfinissent notre rapport à la nature en ville.

Les résidents témoignent d'un bien-être accru, tandis que la biodiversité urbaine (oiseaux, insectes pollinisateurs) y retrouve un sanctuaire inattendu.`,
    category: 'Monde',
    source: 'www.lessentiel.lu',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
    author: {
      name: 'Marc Laurent',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
    },
    publishedAt: 'Il y a 4 heures',
    readTime: '6 min de lecture',
    likes: 512,
    commentsCount: 45
  },
  {
    id: '3',
    title: 'L’art de la déconnexion : Pourquoi le mouvement "Slow Life" séduit la nouvelle génération',
    excerpt: 'Entre injonction à la productivité et fatigue numérique, de plus en plus de citadins optent pour un retour aux sources radical et mesuré.',
    content: `Notifications incessantes, flux d'actualités en continu, urgences permanentes : notre attention est devenue la monnaie la plus convoitée de notre époque. En réaction, un nombre croissant de citadins choisissent de couper le cordon.

Le mouvement "Slow Life" ne prône pas le retour à l'âge de pierre, mais plutôt une réappropriation du temps. Éteindre son smartphone après 20h, privilégier la lecture sur papier, cultiver son propre potager urbain ou s'accorder des retraites en nature sans réseau... Autant de pratiques qui ne relèvent plus du cliché hipster, mais d'une véritable hygiène de vie mentale.

Les entreprises elles-mêmes commencent à intégrer ces enjeux en instaurant le droit à la déconnexion et des semaines de quatre jours pour préserver la santé cognitive de leurs équipes.`,
    category: 'Style de vie',
    source: 'www.franceinfo.fr',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    author: {
      name: 'Camille Leroy',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80'
    },
    publishedAt: 'Il y a 6 heures',
    readTime: '5 min de lecture',
    likes: 890,
    commentsCount: 64
  },
  {
    id: '4',
    title: 'Transition énergétique : Le boom inattendu de l’énergie géothermique profonde',
    excerpt: 'Forer à plusieurs kilomètres sous la croûte terrestre pour alimenter des villes entières en énergie propre et inépuisable devient réalité.',
    content: `Alors que l'éolien et le solaire continuent leur essor, une source d'énergie renouvelable longtemps sous-estimée sort de l'ombre : la géothermie de nouvelle génération. Grâce aux techniques de forage dérivées de l'industrie pétrolière, il est désormais possible d'exploiter la chaleur rocheuse à grande profondeur partout sur le globe.

Contrairement au solaire ou à l'éolien, la géothermie fonctionne 24h/24, indépendamment de la météo. Une seule centrale peut ainsi alimenter des dizaines de milliers de foyers en chauffage et en électricité propre, avec une empreinte au sol minime.`,
    category: 'Économie',
    source: 'www.lessentiel.lu',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80',
    author: {
      name: 'Thomas Mercier',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80'
    },
    publishedAt: 'Il y a 8 heures',
    readTime: '3 min de lecture',
    likes: 230,
    commentsCount: 12
  },
  {
    id: '5',
    title: 'Exposition immersive : Quand les maîtres de la Renaissance rencontrent l’intelligence artificielle',
    excerpt: 'Une rétrospective inédite à Paris explore le dialogue entre les toiles de Léonard de Vinci et les interprétations génératives contemporaines.',
    content: `C'est un choc visuel et émotionnel. Dans les sous-sols voûtés d'un ancien entrepôt réhabilité, les œuvres de la Renaissance prennent vie grâce à des projections monumentales et des algorithmes de morphing subtils qui révèlent les esquisses cachées sous les glacis de peinture.

Loin de dénaturer l'art classique, cette mise en abyme technologique permet au visiteur de pénétrer littéralement dans l'esprit des maîtres anciens, d'observer le grain du parchemin et d'admirer la précision anatomique sous un angle inédit.`,
    category: 'Culture',
    source: 'www.franceinfo.fr',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80',
    author: {
      name: 'Sophie Marceau',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80'
    },
    publishedAt: 'Il y a 12 heures',
    readTime: '4 min de lecture',
    likes: 421,
    commentsCount: 31
  },
  {
    id: '6',
    title: 'L’exploration spatiale privée : Les télescopes citoyens scrutent les exoplanètes',
    excerpt: 'Équipés de matériel de pointe accessible, des passionnés d’astronomie découvrent de nouvelles planètes habitables depuis leur jardin.',
    content: `L'astronomie n'est plus l'apanage exclusif des agences spatiales gouvernementales dotées de budgets colossaux. Aujourd'hui, grâce à la démocratisation des télescopes automatisés et des logiciels d'analyse de données open-source, des cercles d'amateurs avertis publient régulièrement des découvertes majeures.

En analysant les courbes de lumière d'étoiles lointaines, ces astronomes citoyens traquent les transits d'exoplanètes. Une contribution inestimable à la science moderne qui prouve que la curiosité reste notre plus bel outil d'exploration.`,
    category: 'Technologie',
    source: 'www.lessentiel.lu',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    author: {
      name: 'Dr. Éléonore Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
    },
    publishedAt: 'Il y a 1 jour',
    readTime: '5 min de lecture',
    likes: 678,
    commentsCount: 53
  }
];

export const mockWeatherData: Record<string, WeatherData> = {
  'Paris': {
    city: 'Paris',
    country: 'France',
    temperature: 18,
    condition: 'Partiellement nuageux',
    humidity: 62,
    windSpeed: 14,
    pressure: 1016,
    uvIndex: 4,
    visibility: 10,
    icon: 'CloudSun',
    airQuality: { aqi: 42, status: 'Bon', pm25: 10.2, pm10: 18.4 },
    activities: {
      fitness: { ideal: true, score: 85, label: 'Idéal pour le fitness en plein air' },
      cycling: { ideal: true, score: 90, label: 'Excellent pour le vélo' },
      running: { ideal: true, score: 88, label: 'Parfait pour votre séance de running' }
    },
    hourly: [
      { time: '09:00', temp: 14, condition: 'Ensoleillé', pop: 0 },
      { time: '10:00', temp: 15, condition: 'Ensoleillé', pop: 5 },
      { time: '11:00', temp: 17, condition: 'Partiellement nuageux', pop: 10 },
      { time: '12:00', temp: 19, condition: 'Partiellement nuageux', pop: 10 },
      { time: '13:00', temp: 19, condition: 'Partiellement nuageux', pop: 15 },
      { time: '14:00', temp: 18, condition: 'Nuageux', pop: 20 },
      { time: '15:00', temp: 17, condition: 'Averses éparses', pop: 55 },
      { time: '16:00', temp: 16, condition: 'Averses éparses', pop: 60 },
      { time: '17:00', temp: 16, condition: 'Partiellement nuageux', pop: 25 },
      { time: '18:00', temp: 15, condition: 'Ensoleillé', pop: 10 },
      { time: '19:00', temp: 14, condition: 'Ensoleillé', pop: 0 },
      { time: '20:00', temp: 12, condition: 'Dégagé', pop: 0 },
    ],
    forecast: [
      { day: 'Aujourd’hui', date: '15 Mai', tempMin: 12, tempMax: 19, condition: 'Partiellement nuageux', precipitation: 10, uvIndex: 4 },
      { day: 'Lun', date: '16 Mai', tempMin: 14, tempMax: 21, condition: 'Ensoleillé', precipitation: 0, uvIndex: 6 },
      { day: 'Mar', date: '17 Mai', tempMin: 13, tempMax: 18, condition: 'Pluie légère', precipitation: 65, uvIndex: 3 },
      { day: 'Mer', date: '18 Mai', tempMin: 11, tempMax: 17, condition: 'Ensoleillé', precipitation: 5, uvIndex: 5 },
      { day: 'Jeu', date: '19 Mai', tempMin: 15, tempMax: 23, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Ven', date: '20 Mai', tempMin: 16, tempMax: 22, condition: 'Orages isolés', precipitation: 40, uvIndex: 4 },
      { day: 'Sam', date: '21 Mai', tempMin: 14, tempMax: 20, condition: 'Nuageux', precipitation: 20, uvIndex: 4 },
      { day: 'Dim', date: '22 Mai', tempMin: 13, tempMax: 21, condition: 'Ensoleillé', precipitation: 10, uvIndex: 6 },
      { day: 'Lun', date: '23 Mai', tempMin: 15, tempMax: 24, condition: 'Grand soleil', precipitation: 0, uvIndex: 8 },
      { day: 'Mar', date: '24 Mai', tempMin: 14, tempMax: 22, condition: 'Partiellement nuageux', precipitation: 15, uvIndex: 5 },
    ]
  },
  'Montréal': {
    city: 'Montréal',
    country: 'Canada',
    temperature: 12,
    condition: 'Grand soleil',
    humidity: 45,
    windSpeed: 18,
    pressure: 1022,
    uvIndex: 6,
    visibility: 12,
    icon: 'Sun',
    airQuality: { aqi: 28, status: 'Bon', pm25: 6.5, pm10: 12.1 },
    activities: {
      fitness: { ideal: true, score: 92, label: 'Idéal pour le fitness en plein air' },
      cycling: { ideal: true, score: 95, label: 'Parfait pour le vélo' },
      running: { ideal: true, score: 90, label: 'Excellentes conditions de running' }
    },
    hourly: [
      { time: '09:00', temp: 8, condition: 'Ensoleillé', pop: 0 },
      { time: '10:00', temp: 10, condition: 'Ensoleillé', pop: 0 },
      { time: '11:00', temp: 12, condition: 'Ensoleillé', pop: 0 },
      { time: '12:00', temp: 14, condition: 'Grand soleil', pop: 0 },
      { time: '13:00', temp: 14, condition: 'Grand soleil', pop: 0 },
      { time: '14:00', temp: 13, condition: 'Ensoleillé', pop: 0 },
      { time: '15:00', temp: 12, condition: 'Partiellement nuageux', pop: 5 },
      { time: '16:00', temp: 11, condition: 'Ensoleillé', pop: 0 },
      { time: '17:00', temp: 10, condition: 'Ensoleillé', pop: 0 },
      { time: '18:00', temp: 9, condition: 'Dégagé', pop: 0 },
      { time: '19:00', temp: 8, condition: 'Dégagé', pop: 0 },
      { time: '20:00', temp: 7, condition: 'Dégagé', pop: 0 },
    ],
    forecast: [
      { day: 'Aujourd’hui', date: '15 Mai', tempMin: 8, tempMax: 14, condition: 'Grand soleil', precipitation: 0, uvIndex: 6 },
      { day: 'Lun', date: '16 Mai', tempMin: 10, tempMax: 16, condition: 'Ensoleillé', precipitation: 0, uvIndex: 6 },
      { day: 'Mar', date: '17 Mai', tempMin: 9, tempMax: 13, condition: 'Nuageux', precipitation: 15, uvIndex: 4 },
      { day: 'Mer', date: '18 Mai', tempMin: 6, tempMax: 11, condition: 'Averses', precipitation: 80, uvIndex: 3 },
      { day: 'Jeu', date: '19 Mai', tempMin: 7, tempMax: 15, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Ven', date: '20 Mai', tempMin: 9, tempMax: 18, condition: 'Ensoleillé', precipitation: 5, uvIndex: 7 },
      { day: 'Sam', date: '21 Mai', tempMin: 11, tempMax: 19, condition: 'Partiellement nuageux', precipitation: 10, uvIndex: 6 },
      { day: 'Dim', date: '22 Mai', tempMin: 10, tempMax: 17, condition: 'Ensoleillé', precipitation: 0, uvIndex: 6 },
      { day: 'Lun', date: '23 Mai', tempMin: 12, tempMax: 21, condition: 'Grand soleil', precipitation: 0, uvIndex: 8 },
      { day: 'Mar', date: '24 Mai', tempMin: 11, tempMax: 18, condition: 'Averses', precipitation: 45, uvIndex: 4 },
    ]
  },
  'Tokyo': {
    city: 'Tokyo',
    country: 'Japon',
    temperature: 22,
    condition: 'Ensoleillé',
    humidity: 58,
    windSpeed: 9,
    pressure: 1014,
    uvIndex: 7,
    visibility: 10,
    icon: 'Sun',
    airQuality: { aqi: 55, status: 'Modéré', pm25: 14.1, pm10: 25.0 },
    activities: {
      fitness: { ideal: true, score: 80, label: 'Bonnes conditions générales' },
      cycling: { ideal: true, score: 85, label: 'Agréable pour rouler' },
      running: { ideal: false, score: 65, label: 'Chaud, privilégier le matin' }
    },
    hourly: [
      { time: '09:00', temp: 18, condition: 'Ensoleillé', pop: 0 },
      { time: '10:00', temp: 19, condition: 'Ensoleillé', pop: 0 },
      { time: '11:00', temp: 21, condition: 'Ensoleillé', pop: 0 },
      { time: '12:00', temp: 23, condition: 'Ensoleillé', pop: 0 },
      { time: '13:00', temp: 24, condition: 'Ensoleillé', pop: 0 },
      { time: '14:00', temp: 24, condition: 'Ensoleillé', pop: 0 },
      { time: '15:00', temp: 23, condition: 'Partiellement nuageux', pop: 10 },
      { time: '16:00', temp: 22, condition: 'Ensoleillé', pop: 5 },
      { time: '17:00', temp: 20, condition: 'Ensoleillé', pop: 0 },
      { time: '18:00', temp: 19, condition: 'Dégagé', pop: 0 },
      { time: '19:00', temp: 18, condition: 'Dégagé', pop: 0 },
      { time: '20:00', temp: 17, condition: 'Dégagé', pop: 0 },
    ],
    forecast: [
      { day: 'Aujourd’hui', date: '15 Mai', tempMin: 17, tempMax: 24, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Lun', date: '16 Mai', tempMin: 18, tempMax: 25, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Mar', date: '17 Mai', tempMin: 16, tempMax: 21, condition: 'Pluie', precipitation: 90, uvIndex: 2 },
      { day: 'Mer', date: '18 Mai', tempMin: 15, tempMax: 22, condition: 'Nuageux', precipitation: 20, uvIndex: 5 },
      { day: 'Jeu', date: '19 Mai', tempMin: 19, tempMax: 26, condition: 'Ensoleillé', precipitation: 0, uvIndex: 8 },
      { day: 'Ven', date: '20 Mai', tempMin: 20, tempMax: 28, condition: 'Ensoleillé', precipitation: 0, uvIndex: 8 },
      { day: 'Sam', date: '21 Mai', tempMin: 18, tempMax: 23, condition: 'Averses', precipitation: 50, uvIndex: 4 },
      { day: 'Dim', date: '22 Mai', tempMin: 17, tempMax: 24, condition: 'Ensoleillé', precipitation: 10, uvIndex: 7 },
      { day: 'Lun', date: '23 Mai', tempMin: 19, tempMax: 27, condition: 'Ensoleillé', precipitation: 0, uvIndex: 8 },
      { day: 'Mar', date: '24 Mai', tempMin: 18, tempMax: 25, condition: 'Partiellement nuageux', precipitation: 15, uvIndex: 6 },
    ]
  },
  'Genève': {
    city: 'Genève',
    country: 'Suisse',
    temperature: 16,
    condition: 'Averses éparses',
    humidity: 70,
    windSpeed: 11,
    pressure: 1018,
    uvIndex: 4,
    visibility: 8,
    icon: 'CloudRain',
    airQuality: { aqi: 35, status: 'Bon', pm25: 8.0, pm10: 15.2 },
    activities: {
      fitness: { ideal: true, score: 78, label: 'Correct malgré quelques averses' },
      cycling: { ideal: false, score: 60, label: 'Risque de pluie, équipez-vous' },
      running: { ideal: true, score: 75, label: 'Bon air frais après la pluie' }
    },
    hourly: [
      { time: '09:00', temp: 11, condition: 'Averses', pop: 65 },
      { time: '10:00', temp: 12, condition: 'Averses', pop: 60 },
      { time: '11:00', temp: 14, condition: 'Nuageux', pop: 30 },
      { time: '12:00', temp: 15, condition: 'Partiellement nuageux', pop: 20 },
      { time: '13:00', temp: 16, condition: 'Partiellement nuageux', pop: 15 },
      { time: '14:00', temp: 16, condition: 'Ensoleillé', pop: 10 },
      { time: '15:00', temp: 15, condition: 'Nuageux', pop: 25 },
      { time: '16:00', temp: 14, condition: 'Averses', pop: 70 },
      { time: '17:00', temp: 13, condition: 'Averses', pop: 65 },
      { time: '18:00', temp: 12, condition: 'Partiellement nuageux', pop: 20 },
      { time: '19:00', temp: 11, condition: 'Dégagé', pop: 10 },
      { time: '20:00', temp: 10, condition: 'Dégagé', pop: 0 },
    ],
    forecast: [
      { day: 'Aujourd’hui', date: '15 Mai', tempMin: 10, tempMax: 17, condition: 'Averses éparses', precipitation: 60, uvIndex: 4 },
      { day: 'Lun', date: '16 Mai', tempMin: 11, tempMax: 19, condition: 'Partiellement nuageux', precipitation: 20, uvIndex: 5 },
      { day: 'Mar', date: '17 Mai', tempMin: 12, tempMax: 20, condition: 'Ensoleillé', precipitation: 5, uvIndex: 6 },
      { day: 'Mer', date: '18 Mai', tempMin: 13, tempMax: 21, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Jeu', date: '19 Mai', tempMin: 11, tempMax: 18, condition: 'Nuageux', precipitation: 15, uvIndex: 4 },
      { day: 'Ven', date: '20 Mai', tempMin: 14, tempMax: 22, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Sam', date: '21 Mai', tempMin: 15, tempMax: 24, condition: 'Ensoleillé', precipitation: 10, uvIndex: 7 },
      { day: 'Dim', date: '22 Mai', tempMin: 13, tempMax: 20, condition: 'Orages', precipitation: 75, uvIndex: 3 },
      { day: 'Lun', date: '23 Mai', tempMin: 12, tempMax: 21, condition: 'Ensoleillé', precipitation: 10, uvIndex: 6 },
      { day: 'Mar', date: '24 Mai', tempMin: 14, tempMax: 23, condition: 'Grand soleil', precipitation: 0, uvIndex: 8 },
    ]
  },
  'Londres': {
    city: 'Londres',
    country: 'Royaume-Uni',
    temperature: 15,
    condition: 'Couvert',
    humidity: 75,
    windSpeed: 16,
    pressure: 1012,
    uvIndex: 3,
    visibility: 9,
    icon: 'Cloud',
    airQuality: { aqi: 48, status: 'Bon', pm25: 11.5, pm10: 20.2 },
    activities: {
      fitness: { ideal: true, score: 70, label: 'Correct sans pluie' },
      cycling: { ideal: true, score: 75, label: 'Prudence sur les routes humides' },
      running: { ideal: true, score: 80, label: 'Température idéale pour courir' }
    },
    hourly: [
      { time: '09:00', temp: 12, condition: 'Couvert', pop: 20 },
      { time: '10:00', temp: 13, condition: 'Couvert', pop: 25 },
      { time: '11:00', temp: 14, condition: 'Nuageux', pop: 20 },
      { time: '12:00', temp: 15, condition: 'Nuageux', pop: 15 },
      { time: '13:00', temp: 15, condition: 'Partiellement nuageux', pop: 10 },
      { time: '14:00', temp: 15, condition: 'Partiellement nuageux', pop: 10 },
      { time: '15:00', temp: 14, condition: 'Nuageux', pop: 20 },
      { time: '16:00', temp: 14, condition: 'Couvert', pop: 30 },
      { time: '17:00', temp: 13, condition: 'Couvert', pop: 25 },
      { time: '18:00', temp: 12, condition: 'Nuageux', pop: 15 },
      { time: '19:00', temp: 11, condition: 'Nuageux', pop: 10 },
      { time: '20:00', temp: 10, condition: 'Dégagé', pop: 5 },
    ],
    forecast: [
      { day: 'Aujourd’hui', date: '15 Mai', tempMin: 10, tempMax: 15, condition: 'Couvert', precipitation: 20, uvIndex: 3 },
      { day: 'Lun', date: '16 Mai', tempMin: 11, tempMax: 17, condition: 'Partiellement nuageux', precipitation: 10, uvIndex: 4 },
      { day: 'Mar', date: '17 Mai', tempMin: 10, tempMax: 16, condition: 'Averses', precipitation: 70, uvIndex: 3 },
      { day: 'Mer', date: '18 Mai', tempMin: 9, tempMax: 14, condition: 'Pluie', precipitation: 85, uvIndex: 2 },
      { day: 'Jeu', date: '19 Mai', tempMin: 11, tempMax: 18, condition: 'Ensoleillé', precipitation: 5, uvIndex: 6 },
      { day: 'Ven', date: '20 Mai', tempMin: 12, tempMax: 19, condition: 'Partiellement nuageux', precipitation: 10, uvIndex: 5 },
      { day: 'Sam', date: '21 Mai', tempMin: 13, tempMax: 20, condition: 'Ensoleillé', precipitation: 0, uvIndex: 6 },
      { day: 'Dim', date: '22 Mai', tempMin: 12, tempMax: 18, condition: 'Nuageux', precipitation: 20, uvIndex: 4 },
      { day: 'Lun', date: '23 Mai', tempMin: 14, tempMax: 21, condition: 'Ensoleillé', precipitation: 5, uvIndex: 7 },
      { day: 'Mar', date: '24 Mai', tempMin: 13, tempMax: 19, condition: 'Averses', precipitation: 50, uvIndex: 4 },
    ]
  },
  'New York': {
    city: 'New York',
    country: 'États-Unis',
    temperature: 21,
    condition: 'Ensoleillé',
    humidity: 50,
    windSpeed: 15,
    pressure: 1019,
    uvIndex: 7,
    visibility: 14,
    icon: 'Sun',
    airQuality: { aqi: 52, status: 'Modéré', pm25: 13.0, pm10: 22.4 },
    activities: {
      fitness: { ideal: true, score: 90, label: 'Superbes conditions extérieures' },
      cycling: { ideal: true, score: 88, label: 'Idéal pour rouler dans Central Park' },
      running: { ideal: true, score: 92, label: 'Parfait pour le running' }
    },
    hourly: [
      { time: '09:00', temp: 16, condition: 'Ensoleillé', pop: 0 },
      { time: '10:00', temp: 18, condition: 'Ensoleillé', pop: 0 },
      { time: '11:00', temp: 19, condition: 'Ensoleillé', pop: 0 },
      { time: '12:00', temp: 21, condition: 'Grand soleil', pop: 0 },
      { time: '13:00', temp: 22, condition: 'Grand soleil', pop: 0 },
      { time: '14:00', temp: 22, condition: 'Ensoleillé', pop: 0 },
      { time: '15:00', temp: 21, condition: 'Partiellement nuageux', pop: 5 },
      { time: '16:00', temp: 20, condition: 'Ensoleillé', pop: 0 },
      { time: '17:00', temp: 19, condition: 'Ensoleillé', pop: 0 },
      { time: '18:00', temp: 18, condition: 'Dégagé', pop: 0 },
      { time: '19:00', temp: 17, condition: 'Dégagé', pop: 0 },
      { time: '20:00', temp: 15, condition: 'Dégagé', pop: 0 },
    ],
    forecast: [
      { day: 'Aujourd’hui', date: '15 Mai', tempMin: 15, tempMax: 21, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Lun', date: '16 Mai', tempMin: 16, tempMax: 23, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Mar', date: '17 Mai', tempMin: 17, tempMax: 24, condition: 'Grand soleil', precipitation: 0, uvIndex: 8 },
      { day: 'Mer', date: '18 Mai', tempMin: 15, tempMax: 20, condition: 'Orages', precipitation: 80, uvIndex: 4 },
      { day: 'Jeu', date: '19 Mai', tempMin: 14, tempMax: 19, condition: 'Partiellement nuageux', precipitation: 15, uvIndex: 6 },
      { day: 'Ven', date: '20 Mai', tempMin: 16, tempMax: 22, condition: 'Ensoleillé', precipitation: 0, uvIndex: 7 },
      { day: 'Sam', date: '21 Mai', tempMin: 18, tempMax: 25, condition: 'Grand soleil', precipitation: 0, uvIndex: 8 },
      { day: 'Dim', date: '22 Mai', tempMin: 17, tempMax: 23, condition: 'Nuageux', precipitation: 25, uvIndex: 5 },
      { day: 'Lun', date: '23 Mai', tempMin: 16, tempMax: 24, condition: 'Ensoleillé', precipitation: 10, uvIndex: 7 },
      { day: 'Mar', date: '24 Mai', tempMin: 18, tempMax: 26, condition: 'Grand soleil', precipitation: 0, uvIndex: 9 },
    ]
  }
};

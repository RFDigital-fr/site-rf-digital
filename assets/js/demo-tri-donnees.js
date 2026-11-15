/* Démos RF Digital — démo 3 « Tri de mails » : les 21 mails fictifs.
   Tous les noms d'entreprises et de personnes sont inventés (noms génériques, aucune marque).
   cat : opp (opportunité), fou (fournisseur), cli (suivi client), pub, autre
   sous : devis | offre (opp) ; reponse | relance (cli)
   echeance : jours restants avant l'échéance (fou ; négatif = échue)
   Ordre de la liste = ordre d'arrivée dans la boîte (du plus récent au plus ancien). */
window.RFD_TRI_MAILS = [
  { id: 19, de: 'Offre exclusive', ini: 'OE', heure: '11:52', cat: 'pub', objet: 'Félicitations, vous avez gagné un bon d’achat', apercu: 'Cliquez vite pour récupérer votre bon d’achat avant minuit.' },
  { id: 1, de: 'Camille Durand · Cabinet Durand', ini: 'CD', heure: '11:47', cat: 'opp', sous: 'devis', urgent: true, objet: 'Demande de devis : site + prise de rendez-vous, réponse avant vendredi', apercu: 'Nous ouvrons un second cabinet et aimerions votre devis avant vendredi.' },
  { id: 12, de: 'Marc Roussel', ini: 'MR', heure: '11:31', cat: 'cli', sous: 'reponse', objet: 'Re : Facture F-0412 — paiement envoyé', apercu: 'Le virement est parti ce matin. Bonne journée !' },
  { id: 6, de: 'Imprimerie Lambert', ini: 'IL', heure: '11:20', cat: 'fou', echeance: 6, objet: 'Facture n° 2026-118 — échéance dans 6 jours', apercu: 'Veuillez trouver ci-joint la facture n° 2026-118 (346 €).' },
  { id: 17, de: 'Méga Promo', ini: 'MP', heure: '11:05', cat: 'pub', objet: '-70 % sur tout, dernières heures !', apercu: 'Profitez de -70 % sur tout le catalogue jusqu’à ce soir.' },
  { id: 14, de: 'Vous → Cabinet Leroy', ini: 'V', heure: '10:58', cat: 'cli', sous: 'relance', objet: 'Relance : avez-vous pu consulter le devis ?', apercu: 'Je me permets de revenir vers vous au sujet du devis envoyé le 4.' },
  { id: 2, de: 'Hôtel Les Tilleuls', ini: 'LT', heure: '10:44', cat: 'opp', sous: 'devis', objet: 'Tarif pour automatiser nos réservations ?', apercu: 'Nous recevons les réservations par téléphone et par mail. Est-ce automatisable ?' },
  { id: 16, de: 'Cabinet comptable Fabre', ini: 'CF', heure: '10:36', cat: 'autre', urgent: true, objet: 'Pièces à transmettre avant demain midi', apercu: 'Il nous manque encore les relevés de novembre pour la clôture.' },
  { id: 9, de: 'Fournitures Pro Ouest', ini: 'FO', heure: '10:21', cat: 'fou', echeance: 8, objet: 'Avis de prélèvement dans 8 jours', apercu: 'Le prélèvement de 89 € aura lieu dans 8 jours.' },
  { id: 20, de: 'Webinaire Ventes Plus', ini: 'WV', heure: '10:12', cat: 'pub', objet: 'Doublez vos ventes en 7 jours', apercu: 'Inscrivez-vous gratuitement à notre webinaire exclusif.' },
  { id: 11, de: 'Julie Petit · Atelier Couture', ini: 'JP', heure: '10:03', cat: 'cli', sous: 'reponse', objet: 'Re : Relance devis — « C’est validé ! »', apercu: 'C’est validé pour le devis, on démarre quand vous voulez !' },
  { id: 4, de: 'Sophie Bernard · Fleuriste', ini: 'SB', heure: '09:55', cat: 'opp', sous: 'offre', objet: 'Proposition de partenariat', apercu: 'Nous vous proposons un partenariat pour les fêtes de fin d’année.' },
  { id: 7, de: 'Papeterie du Centre', ini: 'PC', heure: '09:48', cat: 'fou', echeance: -3, urgent: true, objet: 'Dernier rappel : facture de 212 € échue', apercu: 'Malgré nos rappels, la facture du 2 octobre reste impayée.' },
  { id: 21, de: 'Service colis', ini: 'SC', heure: '09:40', cat: 'autre', objet: 'Votre colis arrive demain', apercu: 'Livraison prévue demain entre 9 h et 13 h.' },
  { id: 13, de: 'Vous → Restaurant Le Quai', ini: 'V', heure: '09:32', cat: 'cli', sous: 'relance', objet: 'Relance : facture F-0398', apercu: 'Sauf erreur, la facture F-0398 reste en attente de règlement.' },
  { id: 18, de: 'Idées Déco Maison', ini: 'DM', heure: '09:25', cat: 'pub', objet: 'Nos 10 idées pour l’hiver', apercu: 'Plaids, bougies, guirlandes : nos idées pour un intérieur douillet.' },
  { id: 3, de: 'Garage Moreau', ini: 'GM', heure: '09:18', cat: 'opp', sous: 'devis', objet: 'Devis : relances clients automatiques', apercu: 'Pouvez-vous chiffrer l’envoi automatique des rappels d’entretien ?' },
  { id: 15, de: 'Nadia Haddad · Studio Haddad', ini: 'NH', heure: '09:10', cat: 'cli', sous: 'reponse', urgent: true, objet: 'Re : Relance — « Pouvez-vous me rappeler aujourd’hui ? »', apercu: 'Je ne suis pas satisfaite de la livraison. Merci de me rappeler aujourd’hui.' },
  { id: 8, de: 'Transports Rivière', ini: 'TR', heure: '09:02', cat: 'fou', echeance: 20, objet: 'Facture de livraison — novembre', apercu: 'Votre facture de transport de novembre est disponible (échéance dans 20 jours).' },
  { id: 5, de: 'Association Les Coteaux', ini: 'AC', heure: '08:51', cat: 'opp', sous: 'offre', objet: 'Appel d’offres : refonte de notre site', apercu: 'Vous trouverez ci-joint le cahier des charges de notre appel d’offres.' },
  { id: 10, de: 'Électricité Girard', ini: 'EG', heure: '08:37', cat: 'fou', echeance: 30, objet: 'Facture d’intervention — échéance dans 30 jours', apercu: 'Merci pour votre confiance. Facture d’intervention ci-jointe.' }
];

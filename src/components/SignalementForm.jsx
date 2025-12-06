import React, { useState } from "react";
import { ChevronLeft, Upload, X, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ Importez votre NOUVELLE instance Axios configurée
import API from "../config/axios";

// Import des images
import LogoRep from "../assets/images/logo rep.png";
import LogoMesupres from "../assets/images/logo mesupres.png";
import LogoFosika from "../assets/images/logo fosika.png";
import DrapeauFrancais from "../assets/images/Asset 4.png";
import DrapeauMalagasy from "../assets/images/Asset 5.png";
import Megaphone from "../assets/images/Asset 7.png";
import FondAsset from "../assets/images/Asset 8.png";

// Traductions globales - AJOUT DE LA NOUVELLE SECTION "proof"
const translations = {
  fr: {
    welcome: {
      title:
        'Bienvenue sur la plateforme de signalement des fraudes académiques, faux diplômes et harcèlement - "FOSIKA""',
      subtitle:
        "Sous l'égide du MINISTERE DE L'ENSEIGNEMENT SUPERIER ET DE LA RECHERCHE SCIENTIFIQUE (MESUPRES), en partenariat avec le BIANCO, la plateforme FOSIKA s'inscrit dans la volonté nationale d'assainir le système d'enseignement supérieur et de restaurer la confiance du public.",
      initiative:
        "Cette initiative permet de signaler en toute confidentialité tout cas de :",
      cases: [
        "Faux diplômes utilisés lors des recrutements,",
        "Faux diplômes dans le but d'obtenir la validation d'une candidature ou une évolution dans une carrière professionnelle,",
        "Diplômes et attestations falsifiés,",
        "Violence sexuelle constatée.",
      ],
      contribute: "Par vos signalements, vous contribuez à :",
      benefits: [
        "Renforcer l'intégrité académique,",
        "Promouvoir la transparence institutionnelle,",
        "Défendre la valeur du mérite et du savoir.",
      ],
      vigilance:
        "Votre vigilance est un acte citoyen. Ensemble, protégeons la crédibilité de nos universités et la dignité de notre système éducatif.",
      slogan: "Opération FOSIKA : assainir, protéger, refonder.",
      submitBtn: "Soumettre un signalement",
    },
    choice: {
      title: "Choisissez",
      anonymous: "Anonyme",
      identified: "Je m'identifie",
      back: "Retour",
    },
    // NOUVELLE SECTION POUR LE CHOIX DES PREUVES
    proof: {
      title: "Preuves disponibles",
      question: "Avez-vous des preuves à joindre à votre signalement ?",
      description:
        "Les preuves peuvent inclure : photos, vidéos, documents, captures d'écran, etc.",
      yes: "Oui, j'ai des preuves",
      no: "Non, je n'ai pas de preuves",
      continueWithoutProof: "Soumettre sans preuves",
      back: "Retour",
    },
    personal: {
      title: "Mes informations",
      subtitle: "Faire la déclaration",
      name: "Nom complet",
      email: "Email",
      phone: "Téléphone",
      address: "Adresse",
      accept: "Je certifie que ces informations sont exactes",
      continue: "Continuer",
      back: "Retour",
    },
    category: {
      title: "Signalement",
      selectLabel: "Catégorie de signalement :",
      selectPlaceholder: "Sélectionnez une catégorie...",
      detailsLabel: "Description détaillée de la situation :",
      detailsPlaceholder:
        "Décrivez en détail la situation que vous souhaitez signaler...",
      back: "Retour",
      continue: "Continuer",
    },
    upload: {
      title: "Pièces justificatives",
      attachments: "Pièces jointes (photos, vidéos, documents) - Obligatoire",
      attachmentsInfo:
        "Formats acceptés: JPG, JPEG, PNG, MP4, PDF • Taille max: 8 Mo • Au moins 1 fichier requis",
      uploadLabel: "Cliquez pour ajouter des fichiers",
      uploadSubtext: "ou glissez-déposez vos fichiers ici",
      filesAdded: "Fichiers ajoutés",
      acceptTruth:
        "Je certifie que les informations fournies sont véridiques et exemptes de tout mensonge",
      submit: "Soumettre le signalement",
      submitting: "Envoi en cours...",
      back: "Retour",
    },
    success: {
      title: "Signalement reçu avec succès",
      thanks: "Nous vous remercions pour votre contribution",
      reference: "Référence de votre dossier",
      tracking:
        "Vous pouvez suivre l'état de votre dossier via cette référence.",
      trackButton: "Suivre mon dossier",
      home: "Retour à l'accueil",
    },
    categories: {
      "faux-diplomes": "Faux diplômes",
      "Offre de formation irrégulière ( non habilité)":
        "Offre de formation irrégulière ( non habilité)",
      "recrutements-irreguliers": "Recrutements irréguliers",
      harcelement: "Harcèlement",
      corruption: "Corruption",
      divers: "Divers",
    },
    errors: {
      required: "Ce champ est obligatoire",
      emailInvalid: "Email invalide",
      phoneInvalid: "Numéro de téléphone invalide",
      categoryRequired: "Veuillez sélectionner une catégorie",
      descriptionRequired: "Veuillez décrire la situation",
      termsRequired: "Veuillez accepter les conditions",
      truthRequired: "Veuillez certifier la véracité des informations",
      filesRequired: "Au moins une pièce jointe est obligatoire",
      submission: "Erreur lors de la soumission du signalement",
      network: "Erreur de connexion au serveur. Veuillez réessayer.",
      fillRequired: "Veuillez remplir tous les champs obligatoires",
    },
    required: "*",
  },
  mg: {
    welcome: {
      title:
        "Tongasoa eto amin'ny tambajotra miady amin'ny trangana HOSOKA sy DIPLAOMA sandoka ary HERISETRA ara-pananahana - \"FOSIKA\"",
      subtitle:
        "Eo ambany fiahian'ny MINISTERAN'NY FAMPIANARANA AMBONY SY FIKAROHANA ARA-TSIANSA (MESUPRES), sy ny fiaraha-miasa amin'ny Birao Mahaleo-tena Miady amin'ny Kolikoly \"BIANCO\", dia tafiditra ao anatin'ny ezaka nasionaly hanadiovana ny rafi-pampianarana ambony sy hamerenana ny fitokisan'ny vahoaka ny Tambanjotra \"FOSIKA\".",
      initiative:
        "Ity sehatra ity dia natao ahafahana manangom-baovao am-pitokisana momba ireto tranga manaraka ireto :",
      cases: [
        "Diplaoma sandoka ampiasaina amin'ny fandraisana mpiasa,",
        "Diplaoma sandoka ampiasaina mba hahazoana fanamarinana ny fangatahana na fankatoavana ho amin'ny fisondrotana ara-kasa,",
        "Taratasy fanamarinana sandoka,",
        "Herisetra ara-nofo na ara-pananahana.",
      ],
      contribute:
        "Amin'ny fanamarihana sy fanairana ataonao, dia mandray anjara amin'ireto manaraka ireto ianao :",
      benefits: [
        "Fanamafisana ny fahamarinana sy fangaraharana akademika,",
        "Fampiroboroboana ny fahadiovana ara-pitantanana,",
        "Fiarovana ny hasin'ny fahaiza-manao sy ny fahalalana.",
      ],
      vigilance:
        "Ny fahamalinanao dia adidy amin'ny maha olom-pirenena. Isika miaraka no hiaro ny hasin'ny anjerimanontolo sy ny rafi-pampianarana.",
      slogan: "HETSIKA FOSIKA : manadio, miaro, manavao.",
      submitBtn: "HANDEFA FITARAINANA",
    },
    choice: {
      title: "Safidio",
      anonymous: "Tsy mitonona anarana",
      identified: "Hilaza ny momba ahy",
      back: "Hiverina",
    },
    // NOUVELLE SECTION POUR LE CHOIX DES PREUVES
    proof: {
      title: "Porofo misy",
      question: "Manana porofo ampiana amin'ny fitarainana ve ianao ?",
      description:
        "Afaka misy porofo toy ny : sary, horonantsary, taratasy, capture écran, sns.",
      yes: "Eny, manana porofo aho",
      no: "Tsia, tsy manana porofo aho",
      continueWithoutProof: "Hanalefa tsy misy porofo",
      back: "Hiverina",
    },
    personal: {
      title: "MOMBA AHY",
      subtitle: "MANAO NY FANAMBARANA",
      name: "Anarana feno",
      email: "Mailaka",
      phone: "Finday",
      address: "Adiresy",
      accept: "Ekeko fa marina ireo momba ahy ireo",
      continue: "Tohiny",
      back: "Hiverina",
    },
    category: {
      title: "FITARAINANA",
      selectLabel: "Karazana fitarainana :",
      selectPlaceholder: "Safidio ny karazana...",
      detailsLabel: "Fanazavana ilay tranga :",
      detailsPlaceholder:
        "Ampidiro eto ny fanazavana manodidina ilay tranga...",
      back: "Hiverina",
      continue: "Tohiny",
    },
    upload: {
      title: "POROFO",
      attachments:
        "Pièces jointes (Sary, Horonantsary, Taratasy) - TSY MAINTSY",
      attachmentsInfo:
        "Karazana ekena: JPG, JPEG, PNG, MP4, PDF • Habe fara-tampony: 25 Mo • Tsy maintsy misy rakitra iray farafahakeliny",
      uploadLabel: "Tsindrio eto mba hampiditra rakitra",
      uploadSubtext: "na asio eto ny rakitrao",
      filesAdded: "Rakitra nampidirina",
      acceptTruth:
        "Izaho dia minia marina fa tsy misy fitaka na lainga izay voalaza",
      submit: "HALEFA NY FITARAINANA",
      submitting: "Mandefa...",
      back: "Hiverina",
    },
    success: {
      title: "Voaray ny Fitarainanao",
      thanks: "Ankasitrahanay feno ianao",
      reference: "Référence an'ilay antontataratasy",
      tracking:
        "Afaka manaraka ny fivoaran'ny dosierao amin'ity référence ity.",
      trackButton: "Hanaraka ny antontataratasy",
      home: "Hiverina any am-piandohana",
    },
    categories: {
      "faux-diplomes": "Diplaoma sandoka",
      "Offre de formation irrégulière ( non habilitée)":
        "Tolotra fiofanana tsy ara-dalàna (tsy nahazoana alalana)",
      "recrutements-irreguliers": "Fampidirana mpiasa tsy ara-dalàna",
      harcelement: "Fanararaotana",
      corruption: "Kolikoly",
      divers: "Hafa",
    },
    errors: {
      required: "Tsy maintsy fenoina ity",
      emailInvalid: "Email tsy mety",
      phoneInvalid: "Laharana tsy mety",
      categoryRequired: "Safidio ny karazana",
      descriptionRequired: "Lazao ny momba ny tranga",
      termsRequired: "Ekeo ny fepetra",
      truthRequired: "Marina ve ny voalaza?",
      filesRequired: "Tsy maintsy misy rakitra iray farafahakeliny",
      submission: "Nisy olana tamin'ny fandefasana",
      network: "Tsy afaka mifandray. Andramo indray.",
      fillRequired: "Fenoy daholo ny saha ilaina",
    },
    required: "*",
  },
};

// Composant Page d'accueil avec design responsive - Desktop inchangé
const WelcomePage = ({ language, setLanguage, setStep, navigate }) => {
  const t = translations[language];
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-4 font-inter overflow-x-hidden">
      {/* En-tête avec logos - EXACTEMENT COMME AVANT */}
      <div className="w-full max-w-3xl mx-auto mb-3">
        <div className="w-full flex items-center justify-center bg-white p-3 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            {/* Bloc logos : REP en haut, MESUPRES en bas */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-16 w-16 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-16 w-16 object-contain"
              />
            </div>

            <div className="w-[2px] bg-gray-400 h-36"></div>

            {/* Bloc texte avec alignement vertical corrigé */}
            <div className="flex flex-col justify-center space-y-1">
              {/* Texte 1 - Logo République - REMONTÉ */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                REPOBLIKAN'I MADAGASIKARA
              </span>

              {/* Texte 2 - Logo MESUPRES - DESCENDU */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                MINISITERAN'NY FAMPIANARANA AMBONY
                <br />
                SY FIKAROHANA ARA-TSIANSA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cadre vert principal - HAUTEUR PLEINE ÉCRAN SUR MOBILE */}
      <div className="relative w-full max-w-6xl flex-1 min-h-[70vh] md:min-h-0">
        {/* Cadre vert principal sans arrondi - ORIGINAL */}
        <div className="absolute inset-0 border-4 border-[#b3d088] bg-[#f9faf7] z-0"></div>

        {/* Menu de langue responsive - ALIGNÉ AVEC BONJOUR ET LOGO SUR DESKTOP */}
        <div className="absolute top-4 md:top-8 lg:top-12 right-4 z-50">
          {/* Version desktop - EXACTEMENT COMME AVANT */}
          <div className="hidden md:block">
            <div className="text-center font-semibold text-gray-800 mb-2 text-xs">
              {language === "fr" ? "Choisir la langue" : "Safidio ny fiteny"}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setLanguage("mg")}
                className={`flex flex-col items-center gap-1 p-1.5 rounded transition-colors ${
                  language === "mg" ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <img
                  src={DrapeauMalagasy}
                  alt="Malagasy"
                  className="w-7 h-7 rounded-full border border-gray-300"
                />
                <span className="text-xs text-gray-700">Malagasy</span>
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`flex flex-col items-center gap-1 p-1.5 rounded transition-colors ${
                  language === "fr" ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <img
                  src={DrapeauFrancais}
                  alt="Français"
                  className="w-7 h-7 rounded-full border border-gray-300"
                />
                <span className="text-xs text-gray-700">Français</span>
              </button>
            </div>
          </div>

          {/* Version mobile/tablette - SEULEMENT EN DESSOUS DE md */}
          <div className="md:hidden relative">
            {/* Bouton des 3 points */}
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </button>

            {/* Menu modal */}
            {isLangMenuOpen && (
              <>
                {/* Overlay pour fermer en cliquant à côté */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangMenuOpen(false)}
                />

                <div className="absolute right-0 top-10 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[140px]">
                  <div className="text-xs font-semibold text-gray-800 mb-2 text-center">
                    {language === "fr" ? "Langue" : "Fiteny"}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setLanguage("mg");
                        setIsLangMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full p-2 rounded transition-colors ${
                        language === "mg"
                          ? "bg-green-50 text-green-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <img
                        src={DrapeauMalagasy}
                        alt="Malagasy"
                        className="w-5 h-5 rounded-full border border-gray-300"
                      />
                      <span className="text-xs font-medium">Malagasy</span>
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("fr");
                        setIsLangMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full p-2 rounded transition-colors ${
                        language === "fr"
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <img
                        src={DrapeauFrancais}
                        alt="Français"
                        className="w-5 h-5 rounded-full border border-gray-300"
                      />
                      <span className="text-xs font-medium">Français</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contenu principal - CENTRÉ VERTICALEMENT SUR MOBILE */}
        <div className="relative z-10 p-4 md:p-8 lg:p-12 pt-8 md:pt-12 lg:pt-16 h-full flex flex-col justify-center md:justify-start">
          {/* Logo Fosika EN HAUT SUR MOBILE */}
          <div className="absolute left-1/2 top-4 transform -translate-x-1/2 z-20 pointer-events-none md:hidden">
            <img
              src={LogoFosika}
              alt="Logo Fosika"
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Bonjour cher visiteur - EN DESSOUS DU LOGO SUR MOBILE ET ALIGNÉ À GAUCHE */}
          <div className="relative mb-4 md:mb-6 mt-20 md:mt-0 md:-mt-2 lg:-mt-4">
            {/* Bonjour cher visiteur - TEXTE RÉDUIT SUR MOBILE ET ALIGNÉ À GAUCHE */}
            <div className="pl-2 md:pl-2 text-left">
              <span className="text-base sm:text-lg md:text-3xl lg:text-5xl font-bold text-[#5e8f3e] block">
                {language === "fr" ? "Bonjour" : "Miarahaba"}
              </span>
              <span className="text-base sm:text-lg md:text-3xl lg:text-5xl font-bold text-[#b3d088] inline">
                {language === "fr" ? "cher visiteur" : "tompoko"}
              </span>
              <span className="text-base sm:text-lg md:text-3xl lg:text-5xl font-bold text-[#223250] inline">
                ,
              </span>
            </div>

            {/* Logo Fosika - CACHÉ SUR MOBILE (DÉJÀ AFFICHÉ EN HAUT) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:block">
              <img
                src={LogoFosika}
                alt="Logo Fosika"
                className="h-24 sm:h-28 md:h-32 lg:h-32 xl:h-48 w-auto object-contain md:translate-y-0 translate-y-2"
              />
            </div>
          </div>

          {/* LES TROIS POINTS - MASQUÉS SUR MOBILE */}
          <div className="mb-6 bg-[#223250] rounded-[15px] md:rounded-[20px] px-3 md:px-4 py-1.5 md:py-2 w-24 inline-block mr-auto hidden md:block">
            <svg width="60" height="20" className="md:w-80 md:h-26">
              <ellipse cx="12" cy="10" rx="6" ry="6" fill="#ffffff" />
              <ellipse cx="30" cy="10" rx="6" ry="6" fill="#ffffff" />
              <ellipse cx="48" cy="10" rx="6" ry="6" fill="#ffffff" />
            </svg>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-8 lg:gap-16 items-center flex-1">
            <div className="flex-1 pl-2 md:pl-4 pr-1 md:pr-2">
              <div className="clear-both"></div>

              {/* ZONE TEXTE AVEC TEXTE RÉDUIT SUR MOBILE - HAUTEUR AUTOMATIQUE SUR DESKTOP */}
              <div className="text-gray-700 text-xs md:text-sm lg:text-base leading-relaxed mb-4 md:mb-6 max-h-[300px] md:max-h-[250px] lg:max-h-none overflow-y-auto pr-2 md:pr-3 pl-1 md:pl-2 scrollable-text">
                {/* Premier paragraphe avec texte justifié */}
                <p className="mb-2 md:mb-3 text-justify text-xs md:text-sm">
                  {t.welcome.title}
                </p>

                {/* Deuxième paragraphe avec texte justifié */}
                <p className="mb-2 md:mb-3 text-justify text-xs md:text-sm">
                  {t.welcome.subtitle}
                </p>

                <div className="mb-2 md:mb-3">
                  <p className="font-semibold text-gray-800 mb-1 md:mb-2 text-left text-xs md:text-sm">
                    {t.welcome.initiative}
                  </p>
                  <ul className="space-y-0.5 md:space-y-1 text-gray-700 text-xs md:text-sm">
                    {t.welcome.cases.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#b3d088] mr-1 md:mr-2">✓</span>
                        <span className="text-justify">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-2 md:mb-3">
                  <p className="font-semibold text-gray-800 mb-1 md:mb-2 text-left text-xs md:text-sm">
                    {t.welcome.contribute}
                  </p>
                  <ul className="space-y-0.5 md:space-y-1 text-gray-700 text-xs md:text-sm">
                    {t.welcome.benefits.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#b3d088] mr-1 md:mr-2">✓</span>
                        <span className="text-justify">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mb-2 md:mb-3 text-justify text-xs md:text-sm">
                  {t.welcome.vigilance}
                </p>

                <p className="text-center font-bold text-[#5e8f3e] text-xs md:text-base lg:text-lg">
                  {t.welcome.slogan}
                </p>
              </div>
            </div>

            {/* BOUTONS - TAILLE REDUITE SUR MOBILE */}
            <div className="flex flex-col gap-4 md:gap-6 w-full lg:w-auto items-center">
              <button
                onClick={() => setStep(1)}
                className="bg-[#b3d088] text-white py-2 md:py-3 px-4 md:px-8 rounded-xl font-bold text-sm md:text-base transition-transform hover:scale-105 min-w-[180px] md:min-w-[220px] flex items-center justify-center shadow-[3px_6px_0_#e1e4e4] md:shadow-[4px_8px_0_#e1e4e4] flex-col"
              >
                {t.welcome.submitBtn}
                <span className="text-xs font-normal mt-0.5 md:mt-1">
                  {t.welcome.clickHere}
                </span>
              </button>

              <button
                onClick={() => navigate("/suivi")}
                className="border-2 border-[#b3d088] text-[#277335] py-2 md:py-3 px-4 md:px-8 rounded-xl font-bold text-sm md:text-base transition-colors hover:bg-green-50 min-w-[180px] md:min-w-[220px]"
              >
                {language === "fr" ? "Suivre un dossier" : "Hanaraka dossier"}
              </button>
            </div>
          </div>
        </div>

        {/* Mégaphone - TAILLE REDUITE SUR MOBILE */}
        <div className="absolute bottom-0 right-0 z-10">
          <img
            src={Megaphone}
            alt="Megaphone"
            className="w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28"
          />
        </div>
      </div>

      {/* COPYRIGHT EN DEHORS DE LA LIGNE VERTE - VISIBLE SUR TOUTES LES VERSIONS */}
      <div className="w-full max-w-6xl text-center mt-4">
        <div className="text-gray-500 text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>

      <style jsx>{`
        .scrollable-text::-webkit-scrollbar {
          width: 4px;
        }
        .scrollable-text::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 8px;
        }
        .scrollable-text::-webkit-scrollbar-thumb {
          background: #b3d088;
          border-radius: 8px;
        }
        .scrollable-text::-webkit-scrollbar-thumb:hover {
          background: #5e8f3e;
        }
      `}</style>
    </div>
  );
};

// Composant Choix isolé - SANS BOUTON DE LANGUE
const ChoiceStep = ({ language, setStep, setIsAnonymous }) => {
  const t = translations[language];

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-4 font-inter">
      {/* En-tête avec logos - IDENTIQUE à la page d'accueil */}
      <div className="w-full max-w-3xl mx-auto mb-6">
        <div className="w-full flex items-center justify-center bg-white p-3 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            {/* Bloc logos : REP en haut, MESUPRES en bas */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-16 w-16 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-16 w-16 object-contain"
              />
            </div>

            <div className="w-[2px] bg-gray-400 h-36"></div>

            {/* Bloc texte avec alignement vertical corrigé */}
            <div className="flex flex-col justify-center space-y-1">
              {/* Texte 1 - Logo République - REMONTÉ */}
              <span className="font-semibold text-sm uppercase leading-tight  p-2">
                Repoblikan'i Madagasikara
              </span>

              {/* Texte 2 - Logo MESUPRES - DESCENDU */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Ministeran'ny Fampianarana Ambony
                <br />
                sy Fikarohana Ara-tsiansa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec cadre vert - MÊMES DIMENSIONS QUE LA PAGE D'ACCUEIL */}
      <div className="relative w-full max-w-6xl flex-1">
        {/* Cadre vert principal - MÊME DIMENSION QUE LA PAGE BONJOUR */}
        <div className="absolute inset-0 border-4 border-[#b3d088] bg-[#f9faf7] z-0"></div>

        {/* Contenu */}
        <div className="relative z-10 p-8 md:p-12 pt-16 md:pt-20 h-full flex flex-col items-center justify-center">
          {/* Zone centrale avec fond transparent et Asset 8 en arrière-plan */}
          <div className="relative bg-transparent rounded-[80px] px-12 py-16 max-w-xl w-full">
            {/* Asset 8 en fond */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img
                src={FondAsset}
                alt="Fond"
                className="max-w-none w-[140%] h-[140%] object-contain scale-130 select-none opacity-100"
              />
            </div>

            {/* Contenu par-dessus - TOUT CENTRÉ ET ALIGNÉ */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full text-center">
              {/* Titre centré */}
              <h1 className="text-4xl md:text-5xl font-bold text-[#5e8f3e] mb-12">
                {t.choice.title}
              </h1>

              {/* Options parfaitement centrées et alignées */}
              <div className="flex flex-col items-center justify-center space-y-8 w-full">
                {/* Anonyme - PARFAITEMENT CENTRÉ */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex items-center justify-center space-x-4 cursor-pointer text-gray-700 text-lg w-full max-w-[200px]">
                    <input
                      type="radio"
                      name="choix-anonymat"
                      value="anonyme"
                      className="w-6 h-6 border-2 border-gray-400 accent-blue-600"
                      onChange={() => {
                        setIsAnonymous(true);
                        setStep(2); // Redirige vers la nouvelle étape de preuves
                      }}
                    />
                    <span className="flex-1 text-center">
                      {t.choice.anonymous}
                    </span>
                  </label>
                </div>

                {/* Je m'identifie - PARFAITEMENT CENTRÉ */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex items-center justify-center space-x-4 cursor-pointer text-gray-700 text-lg w-full max-w-[200px]">
                    <input
                      type="radio"
                      name="choix-anonymat"
                      value="non-anonyme"
                      className="w-6 h-6 border-2 border-red-500 accent-red-600"
                      onChange={() => {
                        setIsAnonymous(false);
                        setStep(2); // Redirige vers la nouvelle étape de preuves
                      }}
                    />
                    <span className="flex-1 text-center">
                      {t.choice.identified}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Retour - STYLE UNIFORMISÉ */}
          <button
            onClick={() => setStep(0)}
            className="mt-8 text-[#5e8f3e] hover:text-[#4a7b32] flex items-center gap-2 font-semibold text-lg"
          >
            <ChevronLeft size={24} />
            {t.choice.back}
          </button>
        </div>
      </div>

      {/* COPYRIGHT EN DEHORS DE LA LIGNE VERTE */}
      <div className="w-full max-w-6xl text-center mt-4">
        <div className="text-gray-500 text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>
    </div>
  );
};

// NOUVEAU COMPOSANT : Étape de choix des preuves
const ProofStep = ({ language, setStep, setHasProof, isAnonymous }) => {
  const t = translations[language];

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-4 font-inter">
      {/* En-tête avec logos - IDENTIQUE à la page d'accueil */}
      <div className="w-full max-w-3xl mx-auto mb-6">
        <div className="w-full flex items-center justify-center bg-white p-3 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            {/* Bloc logos : REP en haut, MESUPRES en bas */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-16 w-16 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-16 w-16 object-contain"
              />
            </div>

            <div className="w-[2px] bg-gray-400 h-36"></div>

            {/* Bloc texte avec alignement vertical corrigé */}
            <div className="flex flex-col justify-center space-y-1">
              {/* Texte 1 - Logo République - REMONTÉ */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Repoblikan'i Madagasikara
              </span>

              {/* Texte 2 - Logo MESUPRES - DESCENDU */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Ministeran'ny Fampianarana Ambony
                <br />
                sy Fikarohana Ara-tsiansa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec cadre vert - MÊMES DIMENSIONS QUE LA PAGE D'ACCUEIL */}
      <div className="relative w-full max-w-6xl flex-1">
        {/* Cadre vert principal - MÊME DIMENSION QUE LA PAGE BONJOUR */}
        <div className="absolute inset-0 border-4 border-[#b3d088] bg-[#f9faf7] z-0"></div>

        {/* Contenu */}
        <div className="relative z-10 p-8 md:p-12 pt-16 md:pt-20 h-full flex flex-col items-center justify-center">
          {/* Zone centrale avec fond transparent et Asset 8 en arrière-plan */}
          <div className="relative bg-transparent rounded-[80px] px-8 py-12 max-w-xl w-full">
            {/* Asset 8 en fond - MÊME TAILLE QUE CHOISISSEZ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img
                src={FondAsset}
                alt="Fond"
                className="max-w-none w-[120%] h-[120%] object-contain scale-110 select-none opacity-100"
              />
            </div>

            {/* Contenu par-dessus - TOUT CENTRÉ ET ALIGNÉ */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full text-center">
              {/* Titre centré - TAILLE RÉDUITE COMME CHOISISSEZ */}
              <h1 className="text-2xl md:text-3xl font-bold text-[#5e8f3e] mb-6">
                {t.proof.title}
              </h1>

              {/* Question - TEXTE PLUS PETIT */}
              <p className="text-base md:text-lg font-semibold text-gray-800 mb-3 max-w-md">
                {t.proof.question}
              </p>

              {/* Description - TEXTE ENCORE PLUS PETIT */}
              <p className="text-xs text-gray-600 mb-8 max-w-md leading-relaxed">
                {t.proof.description}
              </p>

              {/* Options parfaitement centrées et alignées - ESPACEMENT RÉDUIT */}
              <div className="flex flex-col items-center justify-center space-y-4 w-full">
                {/* Oui - PARFAITEMENT CENTRÉ */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex items-center justify-center space-x-3 cursor-pointer text-gray-700 text-base w-full max-w-[220px]">
                    <input
                      type="radio"
                      name="choix-preuve"
                      value="oui"
                      className="w-5 h-5 border-2 border-green-500 accent-green-600"
                      onChange={() => {
                        setHasProof(true);
                        // Si anonyme, aller directement à la catégorie, sinon aux infos perso
                        if (isAnonymous) {
                          setStep(4); // Catégorie
                        } else {
                          setStep(3); // Infos personnelles
                        }
                      }}
                    />
                    <span className="flex-1 text-center font-medium">
                      {t.proof.yes}
                    </span>
                  </label>
                </div>

                {/* Non - PARFAITEMENT CENTRÉ */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex items-center justify-center space-x-3 cursor-pointer text-gray-700 text-base w-full max-w-[220px]">
                    <input
                      type="radio"
                      name="choix-preuve"
                      value="non"
                      className="w-5 h-5 border-2 border-red-500 accent-red-600"
                      onChange={() => {
                        setHasProof(false);
                        // Si anonyme, aller directement à la catégorie, sinon aux infos perso
                        if (isAnonymous) {
                          setStep(4); // Catégorie
                        } else {
                          setStep(3); // Infos personnelles
                        }
                      }}
                    />
                    <span className="flex-1 text-center font-medium">
                      {t.proof.no}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Retour - STYLE UNIFORMISÉ */}
          <button
            onClick={() => setStep(1)}
            className="mt-6 text-[#5e8f3e] hover:text-[#4a7b32] flex items-center gap-2 font-semibold text-base"
          >
            <ChevronLeft size={20} />
            {t.proof.back}
          </button>
        </div>
      </div>

      {/* COPYRIGHT EN DEHORS DE LA LIGNE VERTE */}
      <div className="w-full max-w-6xl text-center mt-4">
        <div className="text-gray-500 text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>
    </div>
  );
};

// Composant Informations personnelles isolé - SANS BOUTON DE LANGUE
const PersonalInfoStep = ({
  language,
  formData,
  setFormData,
  errors,
  setErrors,
  setStep,
  hasProof,
}) => {
  const t = translations[language];

  const handleNext = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = t.errors.required;
    if (!formData.email?.trim()) newErrors.email = t.errors.required;
    if (!formData.phone?.trim()) newErrors.phone = t.errors.required;
    if (!formData.address?.trim()) newErrors.address = t.errors.required;
    if (!formData.acceptTerms) newErrors.acceptTerms = t.errors.termsRequired;

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep(4); // Vers FITARAINANA
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-4 font-inter">
      {/* En-tête avec logos - IDENTIQUE à la page d'accueil */}
      <div className="w-full max-w-3xl mx-auto mb-4">
        <div className="w-full flex items-center justify-center bg-white p-3 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            {/* Bloc logos : REP en haut, MESUPRES en bas */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-16 w-16 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-16 w-16 object-contain"
              />
            </div>

            <div className="w-[2px] bg-gray-400 h-36"></div>

            {/* Bloc texte avec alignement vertical corrigé */}
            <div className="flex flex-col justify-center space-y-1">
              {/* Texte 1 - Logo République - REMONTÉ */}
              <span className="font-semibold text-sm uppercase leading-tight  p-2">
                Repoblikan'i Madagasikara
              </span>

              {/* Texte 2 - Logo MESUPRES - DESCENDU */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Ministeran'ny Fampianarana Ambony
                <br />
                sy Fikarohana Ara-tsiansa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec cadre vert - MÊMES DIMENSIONS QUE LA PAGE D'ACCUEIL */}
      <div className="relative w-full max-w-6xl flex-1">
        {/* Cadre vert principal - MÊME DIMENSION QUE LA PAGE BONJOUR */}
        <div className="absolute inset-0 border-4 border-[#b3d088] bg-[#f9faf7] z-0"></div>

        {/* Contenu */}
        <div className="relative z-10 p-4 md:p-6 pt-8 md:pt-12 h-full flex flex-col items-center justify-center">
          {/* Titre principal réduit */}
          <h1 className="text-center text-2xl md:text-3xl font-bold text-[#5e8f3e] mb-2">
            {t.personal.title}
          </h1>
          <p className="text-center text-xs font-semibold text-gray-700 mb-6">
            {t.personal.subtitle}
          </p>

          {/* Formulaire sans fond blanc */}
          <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="w-full"
            >
              {/* Nom complet */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.personal.name} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3d088] focus:border-[#b3d088] text-xs transition-all bg-white"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-rose-600 text-xs">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.personal.email} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3d088] focus:border-[#b3d088] text-xs transition-all bg-white"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-rose-600 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Téléphone */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.personal.phone} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3d088] focus:border-[#b3d088] text-xs transition-all bg-white"
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-rose-600 text-xs">{errors.phone}</p>
                )}
              </div>

              {/* Adresse */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.personal.address} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3d088] focus:border-[#b3d088] text-xs transition-all bg-white"
                  required
                />
                {errors.address && (
                  <p className="mt-1 text-rose-600 text-xs">{errors.address}</p>
                )}
              </div>

              {/* Certification */}
              <div className="mb-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={formData.acceptTerms || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acceptTerms: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-3 w-3 text-[#b3d088] rounded focus:ring-[#b3d088]"
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-xs text-gray-700 leading-relaxed"
                >
                  {t.personal.accept}
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="mb-3 text-rose-600 text-xs flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.acceptTerms}
                </p>
              )}

              {/* Boutons */}
              <div className="flex justify-center gap-6 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-[#5e8f3e] hover:text-[#4a7b32] flex items-center gap-2 font-semibold text-lg"
                >
                  <ChevronLeft size={24} />
                  {t.personal.back}
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-[#b3d088] hover:bg-[#9ec97a] text-white font-bold rounded-lg text-sm transition-all shadow-md"
                >
                  {t.personal.continue}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* COPYRIGHT EN DEHORS DE LA LIGNE VERTE */}
      <div className="w-full max-w-6xl text-center mt-4">
        <div className="text-gray-500 text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>
    </div>
  );
};

// Composant Catégorie isolé - SANS BOUTON DE LANGUE
const CategoryStep = ({
  language,
  selectedCategory,
  setSelectedCategory,
  formData,
  setFormData,
  errors,
  setErrors,
  setStep,
  isAnonymous,
  hasProof,
  setReferenceCode,
}) => {
  const t = translations[language];

  const categories = Object.entries(t.categories).map(([value, label]) => ({
    value,
    label,
  }));

  const [acceptTruth, setAcceptTruth] = useState(false);

  const handleNext = () => {
    const newErrors = {};
    if (!selectedCategory) newErrors.category = t.errors.categoryRequired;
    if (!formData.categoryDetails?.trim())
      newErrors.categoryDetails = t.errors.descriptionRequired;
    if (!hasProof && !acceptTruth)
      newErrors.acceptTruth = t.errors.truthRequired;

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      if (hasProof) {
        setStep(5); // Upload
      } else {
        handleSubmitWithoutProof();
      }
    }
  };

  const handleSubmitWithoutProof = async () => {
    const submitData = {
      type: isAnonymous ? "anonyme" : "identifie",
      name: isAnonymous ? "Anonyme" : formData.name,
      email: isAnonymous ? "" : formData.email,
      phone: isAnonymous ? "" : formData.phone,
      address: isAnonymous ? "" : formData.address,
      category: selectedCategory,
      description: formData.categoryDetails,
      accept_terms: true,
      accept_truth: true,
      has_proof: false,
    };

    try {
      const response = await API.post("/reports", submitData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setReferenceCode(response.data.reference);
        setStep(6); // Page de succès
      } else {
        throw new Error(response.data.message || t.errors.submission);
      }
    } catch (error) {
      console.error("❌ Erreur soumission sans preuves:", error);

      let errorMessage = t.errors.submission;
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        errorMessage = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(t.errors.submission + ": " + errorMessage);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-4 font-inter">
      {/* En-tête avec logos - IDENTIQUE à la page d'accueil */}
      <div className="w-full max-w-3xl mx-auto mb-6">
        <div className="w-full flex items-center justify-center bg-white p-3 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            {/* Bloc logos : REP en haut, MESUPRES en bas */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-16 w-16 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-16 w-16 object-contain"
              />
            </div>

            <div className="w-[2px] bg-gray-400 h-36"></div>

            {/* Bloc texte avec alignement vertical corrigé */}
            <div className="flex flex-col justify-center space-y-1">
              {/* Texte 1 - Logo République - REMONTÉ */}
              <span className="font-semibold text-sm uppercase leading-tight  p-2">
                Repoblikan'i Madagasikara
              </span>

              {/* Texte 2 - Logo MESUPRES - DESCENDU */}
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Ministeran'ny Fampianarana Ambony
                <br />
                sy Fikarohana Ara-tsiansa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec cadre vert - MÊMES DIMENSIONS QUE LA PAGE D'ACCUEIL */}
      <div className="relative w-full max-w-6xl flex-1">
        {/* Cadre vert principal - MÊME DIMENSION QUE LA PAGE BONJOUR */}
        <div className="absolute inset-0 border-4 border-[#b3d088] bg-[#f9faf7] z-0"></div>

        {/* Contenu */}
        <div className="relative z-10 p-6 md:p-8 pt-12 md:pt-16 h-full flex flex-col items-center justify-center">
          {/* Titre principal réduit */}
          <h1 className="text-center text-3xl md:text-4xl font-bold text-[#5e8f3e] mb-6">
            {t.category.title}
          </h1>

          {/* Formulaire sans fond blanc */}
          <div className="flex-1 flex flex-col justify-center items-center w-full max-w-xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="w-full"
            >
              {/* Catégorie */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {t.category.selectLabel}{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3d088] focus:border-[#b3d088] text-sm transition-all bg-white"
                  required
                >
                  <option value="" disabled>
                    {t.category.selectPlaceholder}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-rose-600 text-xs flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.category}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {t.category.detailsLabel}{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.categoryDetails || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryDetails: e.target.value,
                    })
                  }
                  placeholder={t.category.detailsPlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b3d088] focus:border-[#b3d088] resize-none text-sm transition-all bg-white"
                  required
                />
                {errors.categoryDetails && (
                  <p className="mt-1 text-rose-600 text-xs flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.categoryDetails}
                  </p>
                )}
              </div>

              {/* Certification pour les signalements sans preuves */}
              {!hasProof && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptTruthNoProof"
                      checked={acceptTruth}
                      onChange={(e) => setAcceptTruth(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-[#b3d088] rounded focus:ring-[#b3d088]"
                    />
                    <label
                      htmlFor="acceptTruthNoProof"
                      className="text-sm text-gray-700 leading-relaxed"
                    >
                      <span className="font-semibold text-rose-600">*</span>{" "}
                      {t.upload.acceptTruth}
                    </label>
                  </div>
                  {errors.acceptTruth && (
                    <p className="mt-2 text-rose-600 text-xs flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.acceptTruth}
                    </p>
                  )}
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-center gap-6 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(isAnonymous ? 2 : 3)}
                  className="text-[#5e8f3e] hover:text-[#4a7b32] flex items-center gap-2 font-semibold text-lg"
                >
                  <ChevronLeft size={24} />
                  {t.category.back}
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-[#b3d088] hover:bg-[#9ec97a] text-white font-bold rounded-lg text-sm transition-all shadow-md"
                >
                  {hasProof
                    ? t.category.continue
                    : t.proof.continueWithoutProof}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* COPYRIGHT EN DEHORS DE LA LIGNE VERTE */}
      <div className="w-full max-w-6xl text-center mt-4">
        <div className="text-gray-500 text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>
    </div>
  );
};

// Composant Upload isolé - SANS BOUTON DE LANGUE
const UploadStep = ({
  language,
  formData,
  setFormData,
  errors,
  setErrors,
  fileErrors,
  setFileErrors,
  isSubmitting,
  setStep,
  handleSubmit,
  hasProof,
}) => {
  const t = translations[language];

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    const errors = [];
    const validFiles = [];
    const maxSize = 25 * 1024 * 1024;
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "video/mp4",
      "application/pdf",
    ];

    newFiles.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        errors.push(
          `${file.name}: Type de fichier non supporté (${
            file.type || "inconnu"
          })`
        );
      } else if (file.size > maxSize) {
        errors.push(
          `${file.name}: Taille trop grande (${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} Mo > 25 Mo)`
        );
      } else {
        validFiles.push(file);
      }
    });

    setFileErrors(errors);

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...validFiles],
      }));
      setErrors((prev) => ({ ...prev, files: "" }));
    }

    e.target.value = "";
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateAndSubmit = () => {
    const newErrors = {};

    if (hasProof === true && formData.files.length === 0) {
      newErrors.files = t.errors.filesRequired;
    }

    if (formData.files.length > 0 && hasProof !== true) {
      // Fichiers présents mais hasProof n'est pas true
    }

    if (!formData.acceptTruth) {
      newErrors.acceptTruth = t.errors.truthRequired;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      handleSubmit();
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-4 font-inter">
      {/* Header officiel */}
      <div className="w-full max-w-3xl mx-auto mb-3">
        <div className="w-full flex items-center justify-center bg-white p-2 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center justify-center space-y-1">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-14 w-14 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-14 w-14 object-contain"
              />
            </div>
            <div className="w-[2px] bg-gray-400 h-28"></div>
            <div className="flex flex-col justify-center space-y-1 text-left">
              <span className="font-semibold text-xs uppercase leading-tight">
                REPUBLIQUE DE MADAGASCAR
              </span>
              <span className="font-semibold text-xs uppercase leading-tight">
                MINISTERE DE L'ENSEGNEMENT SUPERIEURE
                <br />
                ET DE LA RECHERCHE SCIENTIFIQUE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grand cadre vert officiel */}
      <div className="relative w-full max-w-6xl flex-1 mb-4">
        <div className="absolute inset-0 border-4 border-[#b3d088] bg-[#f9faf7] z-0"></div>

        <div className="relative z-10 px-6 pt-8 pb-6 md:px-8 md:pt-12 md:pb-8 h-full flex flex-col">
          {/* Titre principal réduit */}
          <h1 className="text-center text-3xl md:text-4xl font-bold text-[#5e8f3e] mb-6">
            {t.upload.title}
          </h1>

          {/* Formulaire sans fond blanc */}
          <div className="flex-1 flex flex-col justify-center items-center w-full max-w-xl mx-auto">
            {/* Titre secondaire */}
            <p className="text-center text-sm font-semibold text-gray-800 mb-4">
              {t.upload.attachments} <span className="text-rose-600">*</span>
            </p>
            <p className="text-center text-xs text-gray-600 mb-6 leading-relaxed">
              {t.upload.attachmentsInfo}
            </p>

            {/* Zone de dépôt */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#b3d088] transition-all bg-white mb-6 w-full">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.mp4,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {t.upload.uploadLabel}
                </p>
                <p className="text-xs text-gray-500">
                  {t.upload.uploadSubtext}
                </p>
              </label>
            </div>

            {/* Erreurs fichiers */}
            {errors.files && (
              <p className="text-rose-600 text-xs text-center mb-4 flex items-center justify-center gap-1">
                <AlertCircle size={12} /> {errors.files}
              </p>
            )}
            {fileErrors.length > 0 && (
              <div className="mb-4 space-y-1">
                {fileErrors.map((err, i) => (
                  <p
                    key={i}
                    className="text-rose-600 text-xs text-center flex items-center justify-center gap-1"
                  >
                    <X size={12} /> {err}
                  </p>
                ))}
              </div>
            )}

            {/* Liste des fichiers ajoutés */}
            {formData.files.length > 0 && (
              <div className="mb-6 w-full">
                <p className="text-center font-semibold text-gray-700 mb-3 text-sm">
                  {t.upload.filesAdded} ({formData.files.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-3 text-rose-600 hover:text-rose-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certification */}
            <div className="mb-6 flex items-start gap-2 w-full">
              <input
                type="checkbox"
                id="acceptTruth"
                checked={formData.acceptTruth || false}
                onChange={(e) =>
                  setFormData({ ...formData, acceptTruth: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 text-[#b3d088] rounded focus:ring-[#b3d088]"
              />
              <label
                htmlFor="acceptTruth"
                className="text-xs text-gray-700 leading-relaxed"
              >
                <span className="font-semibold text-rose-600">*</span>{" "}
                {t.upload.acceptTruth}
              </label>
            </div>
            {errors.acceptTruth && (
              <p className="mb-4 text-rose-600 text-xs flex items-center gap-1">
                <AlertCircle size={12} /> {errors.acceptTruth}
              </p>
            )}

            {/* Boutons */}
            <div className="flex justify-center gap-6 pt-4 w-full">
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={isSubmitting}
                className="text-[#5e8f3e] hover:text-[#4a7b32] flex items-center gap-2 font-semibold text-lg disabled:opacity-50"
              >
                <ChevronLeft size={24} />
                {t.upload.back}
              </button>
              <button
                onClick={validateAndSubmit}
                disabled={
                  isSubmitting ||
                  (hasProof && formData.files.length === 0) ||
                  !formData.acceptTruth
                }
                className="px-8 py-2 bg-[#b3d088] hover:bg-[#9ec97a] text-white font-bold rounded-lg text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t.upload.submitting}
                  </>
                ) : (
                  t.upload.submit
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT EN DEHORS DE LA LIGNE VERTE */}
      <div className="w-full max-w-6xl text-center mt-4">
        <div className="text-gray-500 text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>
    </div>
  );
};

// Composant Success isolé - SANS BOUTON DE LANGUE
const SuccessPage = ({ language, referenceCode, resetForm, navigate }) => {
  const t = translations[language];
  const Asset8 = new URL("../assets/images/Asset 8.png", import.meta.url).href;
  const Asset9 = new URL("../assets/images/Asset 9.png", import.meta.url).href;

  const generateRef = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REF-${date}-${code}`;
  };

  const displayRef = referenceCode || generateRef();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayRef);
      alert(language === "fr" ? "Référence copiée !" : "Naoty ny référence !");
    } catch (err) {
      console.error("Erreur lors de la copie: ", err);
    }
  };

  return (
    <div className="bg-[#f9faf7] min-h-screen flex flex-col items-center justify-center p-3 overflow-hidden relative font-['Inter',sans-serif]">
      {/* Contenu centré avec Asset 8 en fond */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-2xl">
        {/* Asset 8 + bouton X */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img
            src={Asset8}
            alt="Fond décoratif"
            className="w-full max-w-2xl h-auto object-contain opacity-40"
          />

          {/* Bouton X */}
          <button
            onClick={resetForm}
            className="absolute -top-10 -right-1 z-50 bg-white text-red-500 
           border-2 border-red-500 rounded-full w-6 h-6 
           flex items-center justify-center hover:bg-red-50 
           transition-all shadow-md text-lg font-thin pointer-events-auto"
          >
            ×
          </button>
        </div>

        {/* Contenu principal */}
        <div className="relative z-10 text-center space-y-3 px-2 md:px-6">
          {/* Asset9 + texte */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <div className="flex-shrink-0">
              <img
                src={Asset9}
                alt="Validation"
                className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain"
              />
            </div>

            <div className="text-left space-y-1">
              <h1 className="text-base md:text-xl lg:text-2xl font-bold text-[#5e8f3e] leading-tight">
                {t.success.title}
              </h1>
              <p className="text-gray-700 text-xs md:text-sm lg:text-base">
                {t.success.thanks}
              </p>
            </div>
          </div>

          {/* Référence copiable - TRÈS PETITE SUR MOBILE */}
          <div className="mt-2 md:mt-4 space-y-1 md:space-y-2">
            <p className="text-gray-600 text-xs md:text-sm font-medium">
              {t.success.reference}
            </p>
            <div
              onClick={copyToClipboard}
              className="bg-white border border-[#b3d088] rounded-md p-1 md:p-2 max-w-[240px] md:max-w-sm mx-auto cursor-pointer hover:bg-green-50 transition-colors group"
            >
              <div className="flex items-center justify-between gap-0.5 md:gap-2">
                <span className="font-mono font-bold text-[10px] md:text-base text-gray-900 tracking-tight flex-1 text-center break-all">
                  {displayRef}
                </span>
                <svg
                  className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-400 group-hover:text-[#5e8f3e] transition-colors flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 text-center">
                {language === "fr" ? "Cliquez pour copier" : "Tsindrio hanonta"}
              </p>
            </div>
          </div>

          {/* Bouton de suivi */}
          <div className="mt-2 md:mt-4">
            <button
              onClick={() => navigate("/suivi")}
              className="bg-[#5e8f3e] hover:bg-[#4a7b32] text-white font-bold py-1 md:py-2 px-3 md:px-6 rounded md:rounded-lg transition-all duration-300 shadow hover:shadow-lg transform hover:scale-105 flex items-center gap-1 md:gap-2 mx-auto text-[11px] md:text-sm"
            >
              <svg
                className="w-2.5 h-2.5 md:w-4 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {t.success.trackButton}
            </button>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="w-full max-w-6xl text-center mt-2 md:mt-4">
        <div className="text-gray-500 text-[9px] md:text-xs">
          copyright @ daaq-Mesupres 2025
        </div>
      </div>
    </div>
  );
};
// Composant principal
const SignalementForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(null);
  const [hasProof, setHasProof] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [language, setLanguage] = useState("fr");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    categoryDetails: "",
    acceptTerms: false,
    acceptTruth: false,
    files: [],
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [fileErrors, setFileErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const t = translations[language];
    setIsSubmitting(true);

    try {
      console.log("🔄 Préparation du formulaire...");

      const formDataToSend = new FormData();

      // Champs texte / booleans
      formDataToSend.append("type", isAnonymous ? "anonyme" : "identifie");
      formDataToSend.append("name", isAnonymous ? "Anonyme" : formData.name);
      formDataToSend.append("email", isAnonymous ? "" : formData.email);
      formDataToSend.append("phone", isAnonymous ? "" : formData.phone);
      formDataToSend.append("address", isAnonymous ? "" : formData.address);
      formDataToSend.append("category", selectedCategory);
      formDataToSend.append("description", formData.categoryDetails);

      // ✅ Champs booléens convertis en 0/1 pour Laravel
      formDataToSend.append("accept_terms", formData.acceptTerms ? 1 : 0);
      formDataToSend.append("accept_truth", formData.acceptTruth ? 1 : 0);
      formDataToSend.append("has_proof", hasProof ? 1 : 0);

      // Fichiers (photos / png / mp4)
      if (formData.files && formData.files.length > 0) {
        for (const file of formData.files) {
          formDataToSend.append("files[]", file);
          console.log(
            `📁 Fichier ajouté: ${file.name} (${file.type}, ${file.size} bytes)`
          );
        }
      }

      console.log("📨 Envoi FormData au serveur...");

      const response = await API.post("/reports", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Réponse du serveur:", response.data);

      if (response.data.success) {
        setReferenceCode(response.data.reference);
        setStep(6);
      } else {
        throw new Error(response.data.message || t.errors.submission);
      }
    } catch (error) {
      console.error("💥 Erreur lors de l'envoi:", error);

      let errorMessage = t.errors.submission;
      if (error.response?.data?.errors) {
        errorMessage = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowSuccess(false);
    setStep(0);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      categoryDetails: "",
      acceptTerms: false,
      acceptTruth: false,
      files: [],
    });
    setSelectedCategory("");
    setIsAnonymous(null);
    setHasProof(null);
    setErrors({});
  };

  if (showSuccess) {
    return (
      <SuccessPage
        language={language}
        referenceCode={referenceCode}
        navigate={navigate}
        resetForm={resetForm}
      />
    );
  }

  if (step === 0) {
    return (
      <WelcomePage
        language={language}
        setLanguage={setLanguage}
        setStep={setStep}
        navigate={navigate}
      />
    );
  }

  if (step === 1) {
    return (
      <ChoiceStep
        language={language}
        setStep={setStep}
        setIsAnonymous={setIsAnonymous}
      />
    );
  }

  if (step === 2) {
    return (
      <ProofStep
        language={language}
        setStep={setStep}
        setHasProof={setHasProof}
        isAnonymous={isAnonymous}
      />
    );
  }

  if (step === 3) {
    return (
      <PersonalInfoStep
        language={language}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        setStep={setStep}
        hasProof={hasProof}
      />
    );
  }

  if (step === 4) {
    return (
      <CategoryStep
        language={language}
        isAnonymous={isAnonymous}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        setStep={setStep}
        hasProof={hasProof}
        setReferenceCode={setReferenceCode}
      />
    );
  }

  if (step === 5) {
    return (
      <UploadStep
        language={language}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        fileErrors={fileErrors}
        setFileErrors={setFileErrors}
        isSubmitting={isSubmitting}
        setStep={setStep}
        handleSubmit={handleSubmit}
        hasProof={hasProof}
      />
    );
  }

  if (step === 6) {
    return (
      <SuccessPage
        language={language}
        referenceCode={referenceCode}
        navigate={navigate}
        resetForm={resetForm}
      />
    );
  }

  return null;
};

export default SignalementForm;

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales & Politique de confidentialité",
  description:
    "Consultez nos conditions d'utilisation et notre politique de confidentialité pour comprendre comment nous traitons vos données personnelles.",
};

const sections = [
  {
    id: "mentions-legales",
    title: "1. Mentions légales",
    content: `Le présent site est édité par 2 CS Complexes (ci-après « l'École »), établissement d'enseignement privé situé à Conakry, Guinée.

Directeur de la publication : Direction générale de 2 CS Complexes
Hébergeur : Serveur dédié – territoire de la République de Guinée

Pour toute question relative au présent site, vous pouvez nous contacter via le formulaire de contact disponible sur notre page Contact.`,
  },
  {
    id: "collecte-donnees",
    title: "2. Collecte des données personnelles",
    content: `Dans le cadre de l'utilisation de notre site, nous pouvons être amenés à collecter certaines informations personnelles vous concernant, notamment :

• Votre adresse e-mail (formulaire d'inscription à la newsletter)
• Vos nom, prénom, adresse e-mail et message (formulaire de contact)

Ces données sont collectées avec votre consentement explicite et sont utilisées exclusivement dans le but pour lequel elles ont été communiquées.`,
  },
  {
    id: "finalites",
    title: "3. Finalités du traitement",
    content: `Les données collectées sont utilisées aux fins suivantes :

• Envoi de notre newsletter et de communications relatives à la vie de l'école (événements, actualités, opportunités)
• Traitement et suivi de vos demandes de contact
• Amélioration de la qualité de nos services

Nous ne partageons, ne vendons ni ne louons vos données personnelles à des tiers, sauf obligation légale.`,
  },
  {
    id: "conservation",
    title: "4. Durée de conservation",
    content: `Vos données personnelles sont conservées pour la durée strictement nécessaire à la réalisation des finalités décrites ci-dessus :

• Données de newsletter : jusqu'à votre désinscription
• Données de contact : 3 ans à compter du dernier contact

À l'issue de ces délais, vos données sont supprimées ou anonymisées de façon sécurisée.`,
  },
  {
    id: "droits",
    title: "5. Vos droits",
    content: `Conformément aux lois en vigueur sur la protection des données personnelles, vous disposez des droits suivants :

• Droit d'accès : vous pouvez demander une copie des données vous concernant
• Droit de rectification : vous pouvez demander la correction de données inexactes
• Droit à l'effacement : vous pouvez demander la suppression de vos données
• Droit d'opposition : vous pouvez vous opposer au traitement de vos données à des fins de marketing
• Droit à la portabilité : vous pouvez demander la transmission de vos données dans un format lisible

Pour exercer ces droits, contactez-nous via notre page Contact. Nous nous engageons à répondre dans un délai de 30 jours.`,
  },
  {
    id: "cookies",
    title: "6. Cookies",
    content: `Notre site peut utiliser des cookies techniques indispensables au bon fonctionnement des pages. Ces cookies ne collectent pas d'informations permettant de vous identifier personnellement.

Nous n'utilisons pas de cookies publicitaires ou de pistage tiers. En naviguant sur notre site, vous acceptez l'utilisation de ces cookies techniques.`,
  },
  {
    id: "securite",
    title: "7. Sécurité des données",
    content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, toute divulgation, altération ou destruction.

Cependant, aucune transmission de données sur Internet n'est totalement sécurisée. Nous ne pouvons garantir la sécurité absolue des informations transmises via notre site.`,
  },
  {
    id: "modifications",
    title: "8. Modifications de la politique",
    content: `Nous nous réservons le droit de modifier la présente politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec indication de la date de mise à jour.

Nous vous encourageons à consulter régulièrement cette page pour prendre connaissance d'éventuelles modifications.`,
  },
  {
    id: "contact-legal",
    title: "9. Contact",
    content: `Pour toute question ou réclamation relative à la présente politique ou au traitement de vos données personnelles, vous pouvez nous contacter :

• Via notre formulaire de contact sur le site
• Par courrier à l'adresse de l'établissement : 2 CS Complexes, Conakry, Guinée

Dernière mise à jour : Juin 2025`,
  },
];

export default function LegalPage() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#394995] text-white py-[clamp(40px,6vw,100px)]">
        <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)]">
          <p className="text-white/60 text-sm mb-3 uppercase tracking-widest">2 CS Complexes</p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-bold leading-tight max-w-2xl">
            Mentions légales &amp; Politique de confidentialité
          </h1>
          <p className="text-white/70 mt-4 text-sm max-w-xl leading-relaxed">
            Nous nous engageons à protéger vos données personnelles et à respecter votre vie privée.
            Veuillez lire attentivement la présente politique.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto max-w-[1920px] px-5 md:px-[clamp(20px,5vw,60px)] py-[clamp(40px,5vw,80px)]">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sidebar TOC */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-[#394995] font-semibold mb-4">
                Sommaire
              </p>
              <nav className="space-y-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-gray-600 hover:text-[#394995] transition-colors py-1 border-l-2 border-transparent hover:border-[#394995] pl-3"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 max-w-3xl space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold text-[#394995] mb-4 pb-2 border-b border-blue-100">
                  {s.title}
                </h2>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {s.content}
                </div>
              </section>
            ))}

            {/* Back to top */}
            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/"
                className="text-sm text-[#394995] hover:underline transition-colors"
              >
                ← Retour à l&apos;accueil
              </Link>
              <a
                href="#mentions-legales"
                className="text-sm text-gray-400 hover:text-[#394995] transition-colors"
              >
                Haut de page ↑
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

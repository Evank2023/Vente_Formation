/**
 * LangExam Branding Migration
 *
 * Updates:
 * - Site title, subtitle, description
 * - Theme colors to match LangExam logo (red #D43A2B, green #4CAF50)
 * - Homepage layout with French learning content (A1-C2 levels)
 */
import { MongoClient } from "mongodb";

const DB =
    process.env.DB_CONNECTION_STRING || "mongodb://localhost:27017/courselit";
const client = new MongoClient(DB);

// ─── Brand palette from the LangExam logo ───
const BRAND = {
    red: "#D43A2B",
    redDark: "#B82E22",
    redLight: "#F5E6E4",
    green: "#4CAF50",
    greenLight: "#E8F5E9",
    black: "#1A1A1A",
    white: "#FFFFFF",
    gray50: "#FAFAFA",
    gray100: "#F5F5F5",
    gray200: "#E5E5E5",
    gray300: "#D4D4D4",
    gray400: "#A3A3A3",
    gray500: "#737373",
    gray600: "#525252",
    gray700: "#404040",
    gray800: "#262626",
    gray900: "#171717",
};

function uid() {
    return Math.random().toString(36).slice(2, 12);
}

function textDoc(text) {
    return {
        type: "doc",
        content: [
            {
                type: "paragraph",
                attrs: { dir: null, ignoreBidiAutoUpdate: null },
                content: [{ type: "text", text }],
            },
        ],
    };
}

function richDoc(parts) {
    return {
        type: "doc",
        content: [
            {
                type: "paragraph",
                attrs: { dir: null, ignoreBidiAutoUpdate: null },
                content: parts.map((p) => {
                    if (typeof p === "string") return { type: "text", text: p };
                    return { type: "text", text: p.text, marks: p.marks };
                }),
            },
        ],
    };
}

// ─── Light theme colors ───
const lightColors = {
    background: BRAND.white,
    foreground: BRAND.black,
    card: BRAND.white,
    cardForeground: BRAND.black,
    popover: BRAND.white,
    popoverForeground: BRAND.black,
    primary: BRAND.red,
    primaryForeground: BRAND.white,
    secondary: BRAND.gray100,
    secondaryForeground: BRAND.black,
    muted: BRAND.gray100,
    mutedForeground: BRAND.gray500,
    accent: BRAND.redLight,
    accentForeground: BRAND.red,
    destructive: "#EF4444",
    border: BRAND.gray200,
    input: BRAND.gray200,
    ring: BRAND.red,
    chart1: BRAND.red,
    chart2: BRAND.green,
    chart3: "#F59E0B",
    chart4: "#3B82F6",
    chart5: "#8B5CF6",
    sidebar: BRAND.gray50,
    sidebarForeground: BRAND.black,
    sidebarPrimary: BRAND.red,
    sidebarPrimaryForeground: BRAND.white,
    sidebarAccent: BRAND.redLight,
    sidebarAccentForeground: BRAND.red,
    sidebarBorder: BRAND.gray200,
    sidebarRing: BRAND.red,
    shadow2xs: "0 1px rgba(0,0,0,.05)",
    shadowXs: "0 1px 2px rgba(0,0,0,.05)",
    shadowSm: "0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06)",
    shadowMd:
        "0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)",
    shadowLg:
        "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
    shadowXl:
        "0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)",
    shadow2xl: "0 25px 50px -12px rgba(0,0,0,.25)",
};

// ─── Dark theme colors ───
const darkColors = {
    background: BRAND.gray900,
    foreground: BRAND.gray100,
    card: BRAND.gray800,
    cardForeground: BRAND.gray100,
    popover: BRAND.gray800,
    popoverForeground: BRAND.gray100,
    primary: "#E85A4F",
    primaryForeground: BRAND.white,
    secondary: BRAND.gray700,
    secondaryForeground: BRAND.gray100,
    muted: BRAND.gray700,
    mutedForeground: BRAND.gray400,
    accent: BRAND.gray700,
    accentForeground: "#E85A4F",
    destructive: "#EF4444",
    border: BRAND.gray700,
    input: BRAND.gray700,
    ring: "#E85A4F",
    chart1: "#E85A4F",
    chart2: "#66BB6A",
    chart3: "#FBBF24",
    chart4: "#60A5FA",
    chart5: "#A78BFA",
    sidebar: BRAND.gray800,
    sidebarForeground: BRAND.gray100,
    sidebarPrimary: "#E85A4F",
    sidebarPrimaryForeground: BRAND.white,
    sidebarAccent: BRAND.gray700,
    sidebarAccentForeground: "#E85A4F",
    sidebarBorder: BRAND.gray700,
    sidebarRing: "#E85A4F",
    shadow2xs: "0 1px rgba(0,0,0,.2)",
    shadowXs: "0 1px 2px rgba(0,0,0,.3)",
    shadowSm: "0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)",
    shadowMd:
        "0 4px 6px -1px rgba(0,0,0,.3), 0 2px 4px -2px rgba(0,0,0,.2)",
    shadowLg:
        "0 10px 15px -3px rgba(0,0,0,.3), 0 4px 6px -4px rgba(0,0,0,.2)",
    shadowXl:
        "0 20px 25px -5px rgba(0,0,0,.3), 0 8px 10px -6px rgba(0,0,0,.2)",
    shadow2xl: "0 25px 50px -12px rgba(0,0,0,.5)",
};

// ─── Homepage layout widgets ───
const homepageWidgets = [
    {
        widgetId: uid(),
        name: "hero",
        deleteable: true,
        shared: false,
        settings: {
            title: "Maîtrisez le français, niveau par niveau",
            description: richDoc([
                "Des ",
                {
                    text: "exercices interactifs",
                    marks: [{ type: "bold" }],
                },
                " et des ",
                {
                    text: "vidéos pédagogiques",
                    marks: [{ type: "bold" }],
                },
                " pour progresser du niveau A1 au C2. Préparez vos examens DELF, DALF et TCF avec confiance.",
            ]),
            buttonAction: "/products",
            buttonCaption: "Découvrir les cours",
            alignment: "left",
            style: "card",
            mediaRadius: 2,
            titleFontSize: 5,
            descriptionFontSize: 1,
            contentAlignment: "left",
            backgroundColor: BRAND.red,
            color: BRAND.white,
        },
    },
    {
        widgetId: uid(),
        name: "grid",
        deleteable: true,
        shared: false,
        settings: {
            title: "Choisissez votre niveau",
            description: textDoc(
                "Notre programme couvre tous les niveaux du CECRL, du débutant au niveau avancé.",
            ),
            headerAlignment: "center",
            columns: 3,
            items: [
                {
                    title: "🟢 A1 — Débutant",
                    description: textDoc(
                        "Premiers pas en français : se présenter, saluer, compter, les bases de la vie quotidienne.",
                    ),
                    buttonCaption: "Commencer A1",
                    buttonAction: "/products",
                },
                {
                    title: "🟢 A2 — Élémentaire",
                    description: textDoc(
                        "Conversations simples : faire des achats, parler de sa routine, décrire son environnement.",
                    ),
                    buttonCaption: "Commencer A2",
                    buttonAction: "/products",
                },
                {
                    title: "🟡 B1 — Intermédiaire",
                    description: textDoc(
                        "Autonomie linguistique : exprimer son opinion, raconter des événements, rédiger des textes simples.",
                    ),
                    buttonCaption: "Commencer B1",
                    buttonAction: "/products",
                },
                {
                    title: "🟡 B2 — Intermédiaire avancé",
                    description: textDoc(
                        "Aisance et fluidité : débattre, argumenter, comprendre des textes complexes et des médias français.",
                    ),
                    buttonCaption: "Commencer B2",
                    buttonAction: "/products",
                },
                {
                    title: "🔴 C1 — Avancé",
                    description: textDoc(
                        "Maîtrise approfondie : nuances linguistiques, textes académiques, français professionnel.",
                    ),
                    buttonCaption: "Commencer C1",
                    buttonAction: "/products",
                },
                {
                    title: "🔴 C2 — Maîtrise",
                    description: textDoc(
                        "Niveau natif : compréhension fine de la culture, littérature, expressions idiomatiques.",
                    ),
                    buttonCaption: "Commencer C2",
                    buttonAction: "/products",
                },
            ],
            itemsAlignment: "left",
        },
    },
    {
        widgetId: uid(),
        name: "rich-text",
        deleteable: true,
        shared: false,
        settings: {
            text: {
                type: "doc",
                content: [
                    {
                        type: "heading",
                        attrs: {
                            level: 2,
                            dir: null,
                            ignoreBidiAutoUpdate: null,
                        },
                        content: [
                            {
                                type: "text",
                                text: "Pourquoi choisir LangExam ?",
                            },
                        ],
                    },
                ],
            },
            alignment: "center",
            fontSize: 7,
            verticalPadding: "py-2",
        },
    },
    {
        widgetId: uid(),
        name: "grid",
        deleteable: true,
        shared: false,
        settings: {
            title: "",
            headerAlignment: "center",
            columns: 3,
            items: [
                {
                    title: "📹 Vidéos HD",
                    description: textDoc(
                        "Des cours vidéo enregistrés par des professeurs natifs, avec sous-titres et exercices intégrés.",
                    ),
                },
                {
                    title: "📝 Exercices corrigés",
                    description: textDoc(
                        "Des centaines d'exercices de grammaire, vocabulaire, compréhension orale et écrite avec corrections détaillées.",
                    ),
                },
                {
                    title: "🎯 Préparation examens",
                    description: textDoc(
                        "Entraînez-vous avec des examens blancs DELF, DALF et TCF dans les conditions réelles.",
                    ),
                },
            ],
            itemsAlignment: "center",
            backgroundColor: BRAND.gray100,
        },
    },
    {
        widgetId: uid(),
        name: "featured",
        deleteable: true,
        shared: false,
        settings: {
            title: "Nos cours populaires",
            description: textDoc(
                "Découvrez les formations les plus suivies par nos étudiants.",
            ),
            headerAlignment: "center",
        },
    },
    {
        widgetId: uid(),
        name: "faq",
        deleteable: true,
        shared: false,
        settings: {
            title: "Questions fréquentes",
            description: textDoc(
                "Tout ce que vous devez savoir avant de commencer.",
            ),
            headerAlignment: "center",
            items: [
                {
                    title: "Comment fonctionnent les cours ?",
                    description: textDoc(
                        "Chaque cours contient des vidéos, des exercices interactifs et des quiz. Vous progressez à votre rythme, avec un accès illimité une fois inscrit.",
                    ),
                },
                {
                    title: "Les cours préparent-ils aux examens officiels ?",
                    description: textDoc(
                        "Oui ! Nos cours B1/B2 préparent au DELF, les C1/C2 au DALF, et nous proposons des modules spécifiques TCF.",
                    ),
                },
                {
                    title: "Puis-je essayer avant d'acheter ?",
                    description: textDoc(
                        "Bien sûr ! Chaque niveau propose des leçons gratuites pour que vous puissiez évaluer la qualité de nos cours.",
                    ),
                },
                {
                    title: "En combien de temps puis-je passer un niveau ?",
                    description: textDoc(
                        "En moyenne, comptez 2 à 3 mois par niveau avec 30 minutes de pratique quotidienne. Mais vous avancez à votre propre rythme.",
                    ),
                },
                {
                    title: "Les cours sont-ils adaptés aux francophones ?",
                    description: textDoc(
                        "Nos cours sont conçus pour les apprenants de toutes langues maternelles. Les instructions et les sous-titres sont disponibles en français.",
                    ),
                },
            ],
        },
    },
    {
        widgetId: uid(),
        name: "newsletter-signup",
        deleteable: true,
        shared: false,
        settings: {
            backgroundColor: BRAND.gray100,
        },
    },
];

async function run() {
    await client.connect();
    const db = client.db();

    // 1. Find the domain
    const domain = await db.collection("domains").findOne({});
    if (!domain) {
        console.error("No domain found in database");
        process.exit(1);
    }
    console.log(`Found domain: ${domain.name} (${domain._id})`);

    // 2. Update site settings (title, subtitle, description)
    await db.collection("domains").updateOne(
        { _id: domain._id },
        {
            $set: {
                "settings.title": "LangExam",
                "settings.subtitle":
                    "Apprenez le français — Du niveau A1 au C2",
                "settings.description":
                    "LangExam vous accompagne dans votre apprentissage du français avec des exercices interactifs, des vidéos pédagogiques et une préparation complète aux examens DELF, DALF et TCF.",
            },
        },
    );
    console.log("✓ Site settings updated");

    // 3. Update or create the theme
    const themePayload = {
        colors: { light: lightColors, dark: darkColors },
    };

    let themeDoc = await db
        .collection("userthemes")
        .findOne({ domain: domain._id });
    if (themeDoc) {
        await db.collection("userthemes").updateOne(
            { _id: themeDoc._id },
            {
                $set: {
                    "theme.colors": themePayload.colors,
                    "draftTheme.colors": themePayload.colors,
                    name: "LangExam",
                },
            },
        );
        console.log(`✓ Theme updated (${themeDoc._id})`);
    } else {
        const result = await db.collection("userthemes").insertOne({
            domain: domain._id,
            name: "LangExam",
            theme: themePayload,
            draftTheme: themePayload,
        });
        themeDoc = { _id: result.insertedId };
        await db.collection("domains").updateOne(
            { _id: domain._id },
            { $set: { themeId: result.insertedId.toString() } },
        );
        console.log(`✓ Theme created and linked (${result.insertedId})`);
    }

    // 4. Update the homepage layout
    const homepage = await db.collection("pages").findOne({
        domain: domain._id,
        pageId: "homepage",
    });

    if (homepage) {
        // Keep header/footer (shared widgets), replace everything in between
        const header = homepage.layout?.find((w) => w.name === "header");
        const footer = homepage.layout?.find((w) => w.name === "footer");

        const newLayout = [
            ...(header ? [header] : []),
            ...homepageWidgets,
            ...(footer ? [footer] : []),
        ];

        await db.collection("pages").updateOne(
            { _id: homepage._id },
            {
                $set: {
                    layout: newLayout,
                    draftLayout: newLayout,
                },
            },
        );
        console.log("✓ Homepage layout updated with LangExam content");
    } else {
        console.warn("⚠ Homepage not found — will be created on next visit");
    }

    console.log("\n🎉 LangExam branding applied! Restart your dev server to see changes.");
}

run()
    .catch(console.error)
    .finally(() => client.close());

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } = require("docx");
const fs = require("fs");

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "BlogApp: Screen & Functionality Mapping",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "This document outlines the mapping between application screens, their core functionality, and the corresponding source files for both the mobile and web platforms.",
                            size: 24,
                        }),
                    ],
                    spacing: { after: 400 },
                }),

                // Mobile Section
                new Paragraph({
                    text: "Mobile Application (React Native)",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Base Directory: blog-mobile/src/screens/",
                    spacing: { after: 200 },
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Screen Name", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Functionality", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Primary File Path", bold: true })] }),
                            ],
                        }),
                        ...[
                            ["Welcome", "App introduction, branding, and entry point.", "auth/WelcomeScreen.tsx"],
                            ["Login", "User authentication via Email/Pass, Google, or Microsoft.", "auth/LoginScreen.tsx"],
                            ["Register", "New user account creation.", "auth/RegisterScreen.tsx"],
                            ["Home", "Trending stories, topic categories, and latest feed.", "main/HomeScreen.tsx"],
                            ["Blog Detail", "Full story reading, liking, saving, and commenting.", "main/BlogDetailScreen.tsx"],
                            ["Write/Edit", "Creating new stories or updating existing drafts/posts.", "main/WriteBlogScreen.tsx"],
                            ["Dashboard", "Managing personal stories (Published, Drafts, Saved).", "main/DashboardScreen.tsx"],
                            ["Search", "Discovery of stories and topics via keyword search.", "main/SearchScreen.tsx"],
                            ["Notifications", "Alerts for likes, comments, and new followers.", "main/NotificationScreen.tsx"],
                            ["Profile", "User settings, biography, and personal stats.", "main/ProfileScreen.tsx"],
                            ["Author Profile", "Public view of other authors' published works.", "main/AuthorProfileScreen.tsx"],
                        ].map(row => new TableRow({
                            children: row.map(cell => new TableCell({ children: [new Paragraph({ text: cell })] })),
                        })),
                    ],
                }),

                // Web Section
                new Paragraph({
                    text: "Web Application (Angular)",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400 },
                }),
                new Paragraph({
                    text: "Base Directory: blog-frontend/src/app/pages/",
                    spacing: { after: 200 },
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Screen Name", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Functionality", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Primary Directory Path", bold: true })] }),
                            ],
                        }),
                        ...[
                            ["Home", "Landing page with featured and latest articles.", "home/"],
                            ["Blog Detail", "Responsive reading experience with interactive sidebars.", "blog-detail/"],
                            ["Write/Edit", "Rich text editor for drafting and publishing articles.", "blog-write/"],
                            ["Dashboard", "Content management system for author analytics and posts.", "dashboard/"],
                            ["Profile", "Public and private profile views and settings.", "profile/"],
                            ["Auth", "Unified module for Login, Registration, and Social OAuth.", "auth/"],
                        ].map(row => new TableRow({
                            children: row.map(cell => new TableCell({ children: [new Paragraph({ text: cell })] })),
                        })),
                    ],
                }),

                // Backend Section
                new Paragraph({
                    text: "Backend Services & API",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400 },
                }),
                new Paragraph({
                    text: "Base Directory: BlogApp.API/",
                    spacing: { after: 200 },
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Component", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Functionality", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Primary File Path", bold: true })] }),
                            ],
                        }),
                        ...[
                            ["Blogs API", "Endpoints for CRUD, likes, saves, and categories.", "Controllers/BlogsController.cs"],
                            ["Auth API", "Identity management and JWT token issuance.", "Controllers/AuthController.cs"],
                            ["Upload API", "Image handling and storage for covers and avatars.", "Controllers/UploadController.cs"],
                            ["Blog Service", "Core business logic for content and engagement.", "Services/BlogService.cs"],
                            ["Auth Service", "Secure password hashing and provider integration.", "Services/AuthService.cs"],
                        ].map(row => new TableRow({
                            children: row.map(cell => new TableCell({ children: [new Paragraph({ text: cell })] })),
                        })),
                    ],
                }),

                new Paragraph({
                    text: "Navigation for the mobile app is centrally managed in blog-mobile/src/navigation/AppNavigator.tsx.",
                    spacing: { before: 400 },
                }),
                new Paragraph({
                    text: "Navigation for the web app is defined in blog-frontend/src/app/app-routing.module.ts.",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("BlogApp_Mapping.docx", buffer);
    console.log("Document created successfully.");
});

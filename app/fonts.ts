import { Exo_2, Geist, Inter } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const exo2 = Exo_2({ subsets: ["latin"], variable: "--font-exo" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const jetBrainsMono = localFont({
  src: [
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/JetBrainsMonoNerdPropo/JetBrainsMonoNerdFontPropo-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-mono",
});

export const font_variables = [
  inter.variable,
  exo2.variable,
  geist.variable,
  jetBrainsMono.variable,
];

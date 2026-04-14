import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";

export const metadata: Metadata = {
  title: "AfyaNexus",
  description: "Centralized Athlete Training and Nutrition Tracking System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-brand-gray text-brand-dark antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

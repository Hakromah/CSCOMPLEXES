import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs",
};

export default function ProgramsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">Our Programs</h1>
      <p className="mt-4 text-muted-foreground">
        Details about the academic programs we offer.
      </p>
    </div>
  );
}

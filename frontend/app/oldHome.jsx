import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <section className="py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  A.M.FOFANA HIGH SCHOOL
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Excellence in Education. Future Leaders in the Making.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            </div>
            <Image
              alt="Hero"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              height="550"
              src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              width="550"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Why Choose Us?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Providing quality education and shaping the future of our students.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap /> Smart Classrooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our classrooms are equipped with the latest technology to
                  enhance the learning experience.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users /> Dedicated Teachers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our experienced and passionate teachers are committed to
                  student success.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School /> Digital Report Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Access student progress and reports online, anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">About Our School</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Founded on the principles of academic rigor, innovation, and inclusivity, AMFOFANA High School has been a cornerstone of the community for over 50 years. We are dedicated to nurturing well-rounded individuals who are prepared to excel in a rapidly changing world. Our holistic approach to education balances academic achievement with personal growth, encouraging students to explore their passions and develop critical thinking skills.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

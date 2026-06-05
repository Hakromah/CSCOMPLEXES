'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';

// --- ADDED INTERFACES ---
interface Student {
  id: number;
  userId: string;    // The 12-digit unique ID
  username?: string;
  name?: string;
  email: string;
  gender: string;
  phoneNumber: string;
  grade: string
}

interface Classe {
  id: number;
  name: string;
  grade: string;
}

export default function TeacherStudentsPage() {
  // State with defined Types
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Fetch Teacher's Classes for the Dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/teacher/classes');
        setClasses(response.data);
      } catch (error) {
        console.error('Failed to fetch classes', error);
        toast.error('Could not load your classes');
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch Students based on Class Filter
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        let url = '/teacher/students';
        // If a specific class is selected, add it as a query parameter
        if (selectedClassId !== 'all') {
          url += `?classId=${selectedClassId}`;
        }
        const response = await api.get(url);
        setStudents(response.data);
      } catch (error) {
        toast.error('Failed to fetch students');
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClassId]);

  // 3. Client-side Search Logic
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    const nameStr = (student.username || student.name || '').toLowerCase();
    const idStr = (student?.userId || '').toLowerCase();
    
    return (
      nameStr.includes(searchLower) ||
      idStr.includes(searchLower)
    );
  });

  return (
    <div className="p-[clamp(1.3rem,1vw+0.5rem,2rem)]">
      <h1 className="text-[clamp(1rem,2.5vw+1rem,2rem)] font-bold mb-[clamp(1rem,2vw+1rem,1.5rem)]">My Students</h1>

      <Card className="mb-[clamp(1rem,2vw+1rem,1.5rem)] border py-3 border-slate-200 md:hover:border-primary duration-500 transition-colors shadow-sm">
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {/* Class Filter Dropdown */}
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[280px] border-border lg:hover:border-primary transition-colors duration-300">
              <SelectValue placeholder="All My Classes" />
            </SelectTrigger>
            <SelectContent className="border-border hover:border-primary transition-colors duration-300">
              <SelectItem value="all" >All Classes / All Students</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} - {c.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STUDENT ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>GENDER</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>PHONE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono">{student?.userId || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{student.username || student.name}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phoneNumber}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}




// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { toast } from 'sonner';
// import api from '@/lib/api';

// interface Student {
//   id: number;
//   name: string;
//   email: string;
//   userId: string;
//   gender: string;
//   phoneNumber: string;
// }

// interface Classe {
//   id: number;
//   name: string;
// }

// export default function TeacherStudentsPage() {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [classes, setClasses] = useState<Classe[]>([]);
//   const [selectedClassId, setSelectedClassId] = useState<string>('all');
//   const [isLoading, setIsLoading] = useState(false);

//   // 1. Fetch the classes assigned to this teacher once on mount
//   useEffect(() => {
//     const fetchClasses = async () => {
//       try {
//         const response = await api.get('/teacher/classes'); // Ensure you have this endpoint
//         setClasses(response.data);
//       } catch (error) {
//         console.error('Failed to fetch classes', error);
//       }
//     };
//     fetchClasses();
//   }, []);

//   // 2. Fetch students whenever the selectedClassId changes
//   useEffect(() => {
//     const fetchStudents = async () => {
//       setIsLoading(true);
//       try {
//         let url = '/teacher/students';
//         if (selectedClassId !== 'all') {
//           url += `?classId=${selectedClassId}`;
//         }
//         const response = await api.get(url);
//         setStudents(response.data);
//       } catch (error) {
//         toast.error('Failed to fetch students');
//         console.log(error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchStudents();
//   }, [selectedClassId]);

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold mb-8">My Students</h1>

//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle className="text-sm font-medium">Filter by Class</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Select value={selectedClassId} onValueChange={setSelectedClassId}>
//             <SelectTrigger className="w-[280px]">
//               <SelectValue placeholder="All Classes" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All My Students</SelectItem>
//               {classes.map((c) => (
//                 <SelectItem key={c.id} value={String(c.id)}>
//                   {c.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </CardContent>
//       </Card>

//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>STUDENT ID</TableHead>
//               <TableHead>NAME</TableHead>
//               <TableHead>GENDER</TableHead>
//               <TableHead>EMAIL</TableHead>
//               <TableHead>PHONE</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               <TableRow>
//                 <TableCell colSpan={5} className="text-center py-10">
//                   Loading students...
//                 </TableCell>
//               </TableRow>
//             ) : students.length > 0 ? (
//               students.map((student) => (
//                 <TableRow key={student.id}>
//                   <TableCell className="font-medium">{student.userId}</TableCell>
//                   <TableCell>{student.name}</TableCell>
//                   <TableCell>{student.gender}</TableCell>
//                   <TableCell>{student.email}</TableCell>
//                   <TableCell>{student.phoneNumber}</TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
//                   No students found for this selection.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }


// 00000000000000000000000000000


// 'use client';

// import { startTransition, useEffect, useState } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { toast } from 'sonner';
// import api from '@/lib/api';

// interface Student {
//   id: number;
//   name: string;
//   email: string;
//   userId: number;
//   gender: string;
//   phoneNumber: string;
//   grade: string;
// }

// export default function TeacherStudentsPage() {
//   const [students, setStudents] = useState<Student[]>([]);
//   useEffect(() => {
//     let isMounted = true;
//     (async () => {
//       try {
//         const response = await api.get('/teacher/students');
//         if (!isMounted) return;
//         startTransition(() => {
//           setStudents(response.data);
//         });
//       } catch (error) {
//         toast.error('Failed to fetch students', {
//           description: 'Something went wrong. Please try again.',
//         });
//         console.log(error);
//       }
//     })();
//     return () => { isMounted = false; };
//   }, []);

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold mb-8">My Students</h1>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>STUDENT ID</TableHead>
//             <TableHead>Name</TableHead>
//             <TableHead>GENDER</TableHead>
//             <TableHead>Email</TableHead>
//             <TableHead>PHONE</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {students.map((student) => (
//             <TableRow key={student.id}>
//               <TableCell>{student.userId}</TableCell>
//               <TableCell>{student.name}</TableCell>
//               <TableCell>{student.gender}</TableCell>
//               <TableCell>{student.email}</TableCell>
//               <TableCell>{student.phoneNumber}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }

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
        console.error('Échec de la récupération des classes', error);
        toast.error('Impossible de charger vos classes');
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
        toast.error('Échec de la récupération des étudiants');
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
      <h1 className="text-[clamp(1rem,2.5vw+1rem,2rem)] font-bold mb-[clamp(1rem,2vw+1rem,1.5rem)]">Mes Étudiants</h1>

      <Card className="mb-[clamp(1rem,2vw+1rem,1.5rem)] border py-3 border-slate-200 md:hover:border-primary duration-500 transition-colors shadow-sm">
        <CardHeader>
          <CardTitle>Filtrer et Rechercher</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <Input
            placeholder="Rechercher par nom ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {/* Class Filter Dropdown */}
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[280px] border-border lg:hover:border-primary transition-colors duration-300">
              <SelectValue placeholder="Toutes mes classes" />
            </SelectTrigger>
            <SelectContent className="border-border hover:border-primary transition-colors duration-300">
              <SelectItem value="all" >Toutes les classes / Tous les étudiants</SelectItem>
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
              <TableHead>ID ÉTUDIANT</TableHead>
              <TableHead>NOM</TableHead>
              <TableHead>GENRE</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>TÉLÉPHONE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Chargement des étudiants...
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
                  Aucun étudiant trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

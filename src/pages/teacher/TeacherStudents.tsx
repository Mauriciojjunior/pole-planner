import { useState } from 'react';
import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3,
  Search,
  MoreHorizontal,
  Mail,
  Eye,
  UserPlus
} from 'lucide-react';

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/professor', icon: LayoutDashboard },
  { title: 'Agenda', url: '/professor/agenda', icon: Calendar },
  { title: 'Alunos', url: '/professor/alunos', icon: Users },
  { title: 'Planos', url: '/professor/planos', icon: CreditCard },
  { title: 'Relatórios', url: '/professor/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/professor/configuracoes', icon: Settings },
];

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalClasses: number;
  lastClass?: string;
  status: 'active' | 'inactive';
  subscription?: string;
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ana Beatriz Silva',
    email: 'ana.silva@email.com',
    phone: '(11) 99999-1111',
    totalClasses: 24,
    lastClass: '2026-01-18',
    status: 'active',
    subscription: 'Mensal Ilimitado',
  },
  {
    id: '2',
    name: 'Carlos Eduardo Santos',
    email: 'carlos.santos@email.com',
    phone: '(11) 99999-2222',
    totalClasses: 12,
    lastClass: '2026-01-15',
    status: 'active',
    subscription: 'Pacote 8 Aulas',
  },
  {
    id: '3',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    totalClasses: 36,
    lastClass: '2025-12-20',
    status: 'inactive',
  },
];

export default function TeacherStudents() {
  const [students] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout navItems={navItems} title="Alunos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Alunos</h2>
            <p className="text-muted-foreground">
              Gerencie seus alunos e acompanhe o progresso
            </p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Aluno
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Assinatura</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => s.subscription).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Alunos</CardTitle>
                <CardDescription>
                  {filteredStudents.length} aluno(s) encontrado(s)
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alunos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Aulas</TableHead>
                  <TableHead>Última Aula</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{student.email}</p>
                        {student.phone && (
                          <p className="text-muted-foreground">{student.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{student.totalClasses}</TableCell>
                    <TableCell>
                      {student.lastClass
                        ? new Date(student.lastClass).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {student.subscription || (
                        <span className="text-muted-foreground">Sem plano</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar Mensagem
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            Ver Histórico
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

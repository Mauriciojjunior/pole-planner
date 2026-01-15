import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StudentStats {
  student_id: string;
  student_name: string;
  student_email: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  attended_classes: number;
  missed_classes: number;
  attendance_rate: number;
  last_class_date: string | null;
}

interface StudentStatsTableProps {
  data: StudentStats[];
  title?: string;
}

export function StudentStatsTable({
  data,
  title = "Estatísticas por Aluno",
}: StudentStatsTableProps) {
  const getAttendanceBadge = (rate: number) => {
    if (rate >= 80) return { variant: "default" as const, label: "Excelente" };
    if (rate >= 60) return { variant: "secondary" as const, label: "Bom" };
    if (rate >= 40) return { variant: "outline" as const, label: "Regular" };
    return { variant: "destructive" as const, label: "Baixa" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Confirmadas</TableHead>
              <TableHead className="text-center">Presenças</TableHead>
              <TableHead className="text-center">Faltas</TableHead>
              <TableHead className="text-center">Taxa</TableHead>
              <TableHead>Última Aula</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum dado disponível
                </TableCell>
              </TableRow>
            ) : (
              data.map((student) => {
                const badge = getAttendanceBadge(student.attendance_rate);
                return (
                  <TableRow key={student.student_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.student_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.total_bookings}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.confirmed_bookings}
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {student.attended_classes}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      {student.missed_classes}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={badge.variant}>
                        {student.attendance_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.last_class_date
                        ? format(new Date(student.last_class_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

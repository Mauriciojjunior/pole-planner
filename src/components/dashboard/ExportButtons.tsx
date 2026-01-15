import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportTeacherData, downloadCSV, exportToPDF } from "@/hooks/useDashboard";
import { toast } from "sonner";

interface ExportButtonsProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  pdfElementId?: string;
}

export function ExportButtons({ dateRange, pdfElementId }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async (type: "bookings" | "students" | "classes") => {
    setIsExporting(true);
    try {
      const csv = await exportTeacherData(dateRange, type, "csv");
      if (typeof csv === "string") {
        const labels = {
          bookings: "reservas",
          students: "alunos",
          classes: "aulas",
        };
        downloadCSV(
          csv,
          `${labels[type]}_${dateRange.startDate}_${dateRange.endDate}.csv`
        );
        toast.success("Exportação concluída!");
      }
    } catch (error) {
      toast.error("Erro ao exportar dados");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (pdfElementId) {
      exportToPDF(pdfElementId, `relatorio_${dateRange.startDate}_${dateRange.endDate}`);
      toast.success("Gerando PDF...");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Exportar CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExportCSV("bookings")}>
            <Download className="mr-2 h-4 w-4" />
            Reservas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportCSV("students")}>
            <Download className="mr-2 h-4 w-4" />
            Alunos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportCSV("classes")}>
            <Download className="mr-2 h-4 w-4" />
            Aulas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {pdfElementId && (
        <Button variant="outline" onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      )}
    </div>
  );
}

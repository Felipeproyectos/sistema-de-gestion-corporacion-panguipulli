import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";

export default function InformePDF({ equipos, parches }) {
  const [generando, setGenerando] = useState(false);

  const generarPDF = async () => {
    setGenerando(true);
    
    // Crear contenedor temporal para el contenido del PDF
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.padding = '20mm';
    container.style.background = 'white';
    container.style.fontFamily = 'Inter, sans-serif';
    
    // Agrupar parches por equipo
    const parchesMap = {};
    parches.forEach(p => {
      if (!parchesMap[p.equipo_id]) parchesMap[p.equipo_id] = [];
      parchesMap[p.equipo_id].push(p);
    });

    // Calcular estadísticas
    const totalEquipos = equipos.length;
    const operativos = equipos.filter(e => e.estado === "operativo").length;
    const enMantenimiento = equipos.filter(e => e.estado === "mantenimiento").length;
    const fueraServicio = equipos.filter(e => e.estado === "fuera_de_servicio").length;

    container.innerHTML = `
      <div style="color: #1a2e4a;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #e63946; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #1a2e4a;">Informe de Equipos DEA</h1>
          <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}</p>
        </div>

        <!-- Resumen Ejecutivo -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #e63946; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a2e4a;">Resumen Ejecutivo</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total de Equipos</p>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 700; color: #1a2e4a;">${totalEquipos}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Operativos</p>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 700; color: #10b981;">${operativos}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">En Mantenimiento</p>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 700; color: #f59e0b;">${enMantenimiento}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Fuera de Servicio</p>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 700; color: #ef4444;">${fueraServicio}</p>
            </div>
          </div>
        </div>

        <!-- Detalle de Equipos -->
        <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #1a2e4a;">Detalle de Equipos</h2>
        ${equipos.map((eq, idx) => {
          const equipoParches = parchesMap[eq.id] || [];
          const estadoColor = eq.estado === "operativo" ? "#10b981" : eq.estado === "mantenimiento" ? "#f59e0b" : "#ef4444";
          
          return `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div>
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1a2e4a;">${eq.marca} ${eq.modelo}</h3>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">S/N: ${eq.numero_serie}</p>
                </div>
                <span style="background: ${estadoColor}20; color: ${estadoColor}; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                  ${eq.estado.replace("_", " ")}
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                <div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Establecimiento</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-weight: 500;">${eq.establecimiento}</p>
                </div>
                <div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Lugar Destinado</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-weight: 500;">${eq.lugar_destinado || "—"}</p>
                </div>
                <div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Año de Adquisición</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-weight: 500;">${eq.anio_adquisicion || "—"}</p>
                </div>
                <div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Valor</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-weight: 500;">${eq.valor ? "$" + Number(eq.valor).toLocaleString() : "—"}</p>
                </div>
              </div>

              ${equipoParches.length > 0 ? `
                <div style="background: #f8fafc; border-radius: 6px; padding: 12px; margin-top: 12px;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1a2e4a;">Inventario de Parches</p>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    ${equipoParches.map(p => {
                      const diasRestantes = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
                      const vencColor = diasRestantes <= 0 ? "#ef4444" : diasRestantes <= 30 ? "#f59e0b" : "#10b981";
                      return `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px;">
                          <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase;">${p.tipo}</p>
                          <p style="margin: 2px 0; font-size: 14px; font-weight: 600; color: #1a2e4a;">x${p.cantidad}</p>
                          <p style="margin: 0; font-size: 9px; color: ${vencColor};">Vence: ${format(new Date(p.fecha_vencimiento), "dd/MM/yy")}</p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : `
                <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">Sin parches registrados</p>
              `}

              ${eq.notas ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Notas</p>
                  <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">${eq.notas}</p>
                </div>
              ` : ""}
            </div>
          `;
        }).join('')}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">Sistema de Gestión de Equipos DEA • Informe generado automáticamente</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = 0;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Abrir en nueva ventana para imprimir o guardar
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } finally {
      document.body.removeChild(container);
      setGenerando(false);
    }
  };

  return (
    <button
      onClick={generarPDF}
      disabled={generando}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
      style={{ background: "#6366f1" }}
    >
      {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {generando ? "Generando..." : "Descargar Informe PDF"}
    </button>
  );
}
import React, { memo, useContext, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { ThemeContext } from "../context/ThemeContext";

// URL GeoJSON Dunia
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Senarai Negara Larangan
const flaggedCountries = ["Israel", "North Korea" , "Afghanistan" , "Iran", "Iraq", "Libya", "Lubnan", "Myanmar", "Palestine" , "Somalia","Nigeria"];

const LeaveMap = ({ requests }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // --- STATE UNTUK TOOLTIP ---
  const [tooltip, setTooltip] = useState({
    content: "",
    x: 0,
    y: 0,
    isVisible: false
  });

  // Proses Data dari Firebase
  const visitedCountries = useMemo(() => {
    const countries = new Set();
    const activeLeaves = requests.filter(r => r.status === 'Approved');
    
    activeLeaves.forEach(leave => {
      if (leave.leaveAddress) {
         countries.add(leave.leaveAddress.toLowerCase()); 
      }
    });
    return Array.from(countries);
  }, [requests]);

  // Fungsi tentukan status negara
  const getCountryStatus = (geoName) => {
    const nameLower = geoName.toLowerCase();
    
    if (flaggedCountries.some(fc => fc.toLowerCase() === nameLower)) return "flagged";
    
    const isVisited = requests.some(r => 
        r.status === 'Approved' && 
        r.leaveAddress?.toLowerCase().includes(nameLower)
    );

    if (isVisited) return "visited";
    return "neutral";
  };

  const colors = {
    bg: isDark ? "#1e293b" : "#ffffff",
    default: isDark ? "#334155" : "#e2e8f0",
    stroke: isDark ? "#1e293b" : "#ffffff",
    hover: isDark ? "#475569" : "#cbd5e1",
    visited: "#3b82f6",
    flagged: "#ef4444",
    textPrimary: isDark ? "#ffffff" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
    tooltipText: isDark ? "#fff" : "#1e293b"
  };

  return (
    // Tambah onMouseMove pada wrapper untuk jejak koordinat tetikus
    <div 
        className={`w-full h-full rounded-3xl overflow-hidden relative shadow-sm border transition-colors duration-300 ${isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'}`}
        onMouseMove={(e) => {
            // Dapatkan posisi relatif kepada container
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip(prev => ({
                ...prev,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }));
        }}
    >
      
      {/* Label Peta */}
      <div className="absolute top-5 left-6 z-10 pointer-events-none">
        <h3 className="font-bold text-lg transition-colors duration-300" style={{ color: colors.textPrimary }}>
            Pemetaan Lokasi
        </h3>
        <p className="text-xs transition-colors duration-300" style={{ color: colors.textSecondary }}>
            Taburan anggota bercuti di luar negara
        </p>
        
        
        {/* Legend */}
        <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></span>
                <span className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>Negara Larangan</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></span>
                <span className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>Lokasi Anggota</span>
            </div>
        </div>
      </div>

      {/* --- KOMPONEN TOOLTIP TERSUAI --- */}
      {tooltip.isVisible && (
        <div 
            className="absolute z-50 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg pointer-events-none backdrop-blur-sm border border-slate-200 dark:border-slate-700 transition-opacity duration-150"
            style={{ 
                top: tooltip.y + 15, // Jarak sikit dari cursor
                left: tooltip.x + 15, 
                backgroundColor: colors.tooltipBg,
                color: colors.tooltipText
            }}
        >
            {tooltip.content}
        </div>
      )}

      <ComposableMap projectionConfig={{ scale: 140, center: [0, 20] }} className="w-full h-full">
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const { name } = geo.properties;
                const status = getCountryStatus(name);
                
                let fillColor = colors.default;
                let hoverColor = colors.hover;

                if (status === "flagged") {
                    fillColor = colors.flagged;
                    hoverColor = "#dc2626";
                } else if (status === "visited") {
                    fillColor = colors.visited;
                    hoverColor = "#2563eb";
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    // Event Handlers untuk Tooltip
                    onMouseEnter={() => {
                        setTooltip(prev => ({ ...prev, content: name, isVisible: true }));
                    }}
                    onMouseLeave={() => {
                        setTooltip(prev => ({ ...prev, isVisible: false }));
                    }}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: colors.stroke,
                        strokeWidth: 0.75,
                        outline: "none",
                        transition: "all 300ms"
                      },
                      hover: {
                        fill: hoverColor,
                        stroke: colors.stroke,
                        strokeWidth: 1,
                        outline: "none",
                        cursor: status !== "neutral" ? "pointer" : "default"
                      },
                      pressed: {
                        fill: fillColor,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(LeaveMap);
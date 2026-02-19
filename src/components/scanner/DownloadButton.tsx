'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { AuditDocument } from './AuditPDF';
import type { ScanResult } from '@/lib/scanner/types';
import { FileDown, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
    report: ScanResult;
    targetHost: string;
}

export function DownloadButton({ report, targetHost }: DownloadButtonProps) {
    const filename = `supascan-audit-${targetHost}-${new Date().toISOString().slice(0, 10)}.pdf`;

    return (
        <PDFDownloadLink
            document={<AuditDocument report={report} targetHost={targetHost} />}
            fileName={filename}
            className="inline-flex"
        >
            {({ loading }) => (
                <button
                    disabled={loading}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-wait px-4 py-2 rounded-lg transition-all active:scale-95"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Building PDF…
                        </>
                    ) : (
                        <>
                            <FileDown className="w-4 h-4" />
                            Download Report
                        </>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
}

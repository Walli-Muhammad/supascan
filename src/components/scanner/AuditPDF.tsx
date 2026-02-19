import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from '@react-pdf/renderer';
import type { ScanResult, Finding, SafeguardCheck } from '@/lib/scanner/types';

// ── Styles ─────────────────────────────────────────────────────────────────────

const C = {
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate700: '#334155',
    slate900: '#0f172a',
    white: '#ffffff',
} as const;

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: C.slate900,
        backgroundColor: C.white,
        paddingTop: 52,
        paddingBottom: 52,
        paddingHorizontal: 52,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        paddingBottom: 14,
        borderBottomWidth: 2,
        borderBottomColor: C.green,
    },
    headerLeft: { flexDirection: 'column', gap: 3 },
    brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.slate900 },
    brandSub: { fontSize: 8, color: C.slate500, letterSpacing: 2 },
    headerRight: { alignItems: 'flex-end', gap: 3 },
    headerDate: { fontSize: 8, color: C.slate500 },
    headerHost: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate700 },

    // ── Sections ──
    section: { marginBottom: 18 },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: C.slate900,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: C.slate200,
    },

    // ── Executive grade cards ──
    gradeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    gradeCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 6,
        padding: 12,
        alignItems: 'center',
    },
    gradeCardGreen: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
    gradeCardAmber: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    gradeCardRed: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
    gradeCardGray: { backgroundColor: C.slate50, borderColor: C.slate200 },

    gradeLetter: { fontSize: 28, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    gradeLetterGreen: { color: C.green },
    gradeLetterAmber: { color: C.amber },
    gradeLetterRed: { color: C.red },
    gradeLetterGray: { color: C.slate400 },

    gradeLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, color: C.slate500 },

    // ── Score summary row ──
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    summaryCard: {
        flex: 1,
        backgroundColor: C.slate50,
        borderWidth: 1,
        borderColor: C.slate200,
        borderRadius: 6,
        padding: 10,
    },
    summaryLabel: { fontSize: 7, color: C.slate500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.slate900 },
    summaryValueGreen: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.green },
    summaryValueAmber: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.amber },
    summaryValueRed: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.red },

    // ── Critical issues list ──
    criticalBox: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 6,
        padding: 10,
        marginBottom: 14,
    },
    criticalBoxTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#991b1b',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    criticalItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
    criticalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.red, marginTop: 2 },
    criticalText: { fontSize: 9, color: '#7f1d1d', flex: 1, lineHeight: 1.5 },

    // ── Finding cards ──
    findingCard: {
        marginBottom: 10,
        borderRadius: 6,
        borderWidth: 1,
        overflow: 'hidden',
    },
    findingCardCritical: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
    findingCardHigh: { borderColor: '#fdba74', backgroundColor: '#fffbf5' },
    findingCardMedium: { borderColor: '#fcd34d', backgroundColor: '#fffef5' },
    findingCardDefault: { borderColor: '#bfdbfe', backgroundColor: '#f5f9ff' },

    findingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    findingHeaderCritical: { backgroundColor: '#fee2e2' },
    findingHeaderHigh: { backgroundColor: '#ffedd5' },
    findingHeaderMedium: { backgroundColor: '#fef9c3' },
    findingHeaderDefault: { backgroundColor: '#dbeafe' },

    severityBadge: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.white,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badgeCritical: { backgroundColor: '#ef4444' },
    badgeHigh: { backgroundColor: '#f97316' },
    badgeMedium: { backgroundColor: '#eab308' },
    badgeDefault: { backgroundColor: '#3b82f6' },

    categoryBadge: {
        fontSize: 7,
        color: C.slate500,
        backgroundColor: C.slate100,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
    },

    findingTable: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.slate900, flex: 1 },
    findingBody: { paddingHorizontal: 12, paddingVertical: 8 },
    findingMessage: { fontSize: 9, color: '#475569', marginBottom: 6, lineHeight: 1.5 },

    riskBox: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fed7aa',
        borderRadius: 4,
        padding: 8,
        marginBottom: 6,
    },
    riskLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#c2410c', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
    riskText: { fontSize: 9, color: '#7c2d12', lineHeight: 1.5 },

    codeBox: {
        backgroundColor: C.slate900,
        borderRadius: 4,
        padding: 8,
        marginTop: 4,
    },
    codeLabel: { fontSize: 7, color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    codeText: { fontSize: 8, fontFamily: 'Courier', color: '#34d399', lineHeight: 1.6 },

    // ── Safeguards table ──
    safeguardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.slate200,
    },
    safeguardName: { fontSize: 9, color: C.slate700, flex: 1 },
    safeguardDetail: { fontSize: 8, color: C.slate400, flex: 2 },
    statusPill: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 3,
        textTransform: 'uppercase',
    },
    statusPass: { backgroundColor: '#dcfce7', color: '#166534' },
    statusFail: { backgroundColor: '#fee2e2', color: '#991b1b' },
    statusWarn: { backgroundColor: '#fef9c3', color: '#854d0e' },
    statusUnknown: { backgroundColor: C.slate100, color: C.slate500 },

    // ── Passed checks ──
    passedItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 },
    passedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green, marginTop: 2 },
    passedText: { fontSize: 9, color: '#374151', flex: 1, lineHeight: 1.5 },

    // ── Footer ──
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 52,
        right: 52,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: C.slate200,
        paddingTop: 7,
    },
    footerText: { fontSize: 7.5, color: C.slate400 },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLetter(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 55) return 'C';
    if (score >= 35) return 'D';
    return 'F';
}

function scoreStyle(score: number) {
    if (score >= 90) return styles.summaryValueGreen;
    if (score >= 70) return styles.summaryValueAmber;
    return styles.summaryValueRed;
}

function gradeCardStyle(score: number | null) {
    if (score === null) return { card: styles.gradeCardGray, letter: styles.gradeLetterGray };
    if (score >= 90) return { card: styles.gradeCardGreen, letter: styles.gradeLetterGreen };
    if (score >= 70) return { card: styles.gradeCardAmber, letter: styles.gradeLetterAmber };
    return { card: styles.gradeCardRed, letter: styles.gradeLetterRed };
}

function findingCardStyle(severity: string) {
    switch (severity) {
        case 'CRITICAL': return { card: styles.findingCardCritical, header: styles.findingHeaderCritical, badge: styles.badgeCritical };
        case 'HIGH': return { card: styles.findingCardHigh, header: styles.findingHeaderHigh, badge: styles.badgeHigh };
        case 'MEDIUM': return { card: styles.findingCardMedium, header: styles.findingHeaderMedium, badge: styles.badgeMedium };
        default: return { card: styles.findingCardDefault, header: styles.findingHeaderDefault, badge: styles.badgeDefault };
    }
}

function safeguardStatusStyle(status: SafeguardCheck['status']) {
    switch (status) {
        case 'PASS': return styles.statusPass;
        case 'FAIL': return styles.statusFail;
        case 'WARN': return styles.statusWarn;
        default: return styles.statusUnknown;
    }
}

// Compute domain-specific scores from findings
function domainScore(findings: Finding[], category: string): number {
    const domainFindings = findings.filter(f => f.category === category);
    let s = 100;
    for (const f of domainFindings) {
        if (f.severity === 'CRITICAL') s -= 30;
        else if (f.severity === 'HIGH') s -= 15;
        else if (f.severity === 'MEDIUM') s -= 8;
        else s -= 3;
    }
    return Math.max(0, Math.min(100, s));
}

// ── PDF Document ───────────────────────────────────────────────────────────────

interface AuditDocumentProps {
    report: ScanResult;
    targetHost: string;
}

const PageFooter = ({ targetHost, date }: { targetHost: string; date: string }) => (
    <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Supascan — {targetHost} — {date}</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
);

export function AuditDocument({ report, targetHost }: AuditDocumentProps) {
    const date = new Date(report.timestamp).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const overallLetter = getLetter(report.score);
    const criticals = report.findings.filter(f => f.severity === 'CRITICAL');
    const nonCriticals = report.findings.filter(f => f.severity !== 'CRITICAL');

    // Tables with a CRITICAL finding should NOT appear in verified safeguards
    const criticalTables = new Set(criticals.map(f => f.table));
    const filteredPassedChecks = report.passed_checks.filter(
        check => !Array.from(criticalTables).some(t => check.includes(t))
    );

    // Domain scores
    const rlsScore = domainScore(report.findings, 'RLS');
    const authScore = domainScore(report.findings, 'AUTH');
    const pitrScore = domainScore(report.findings, 'PITR');
    const rlsGrade = gradeCardStyle(rlsScore);
    const authGrade = gradeCardStyle(authScore);
    const pitrGrade = gradeCardStyle(pitrScore);
    const overallGrade = gradeCardStyle(report.score);

    // Group non-critical findings by category
    const categoryOrder = ['PERMISSIONS', 'NETWORK', 'MISCONFIGURATION', 'AUTH', 'PITR', 'RLS'];
    const grouped = new Map<string, Finding[]>();
    for (const f of nonCriticals) {
        if (!grouped.has(f.category)) grouped.set(f.category, []);
        grouped.get(f.category)!.push(f);
    }

    return (
        <Document
            title={`Supascan Security Audit — ${targetHost}`}
            author="Supascan"
            subject="Enterprise Security Audit Report"
        >
            {/* ── PAGE 1: EXECUTIVE SUMMARY ── */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header} fixed>
                    <View style={styles.headerLeft}>
                        <Text style={styles.brandName}>Supascan</Text>
                        <Text style={styles.brandSub}>ENTERPRISE SECURITY AUDIT REPORT</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.headerDate}>Generated: {date}</Text>
                        <Text style={styles.headerHost}>{targetHost}</Text>
                    </View>
                </View>

                {/* Domain Grade Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Domain Grades</Text>
                    <View style={styles.gradeRow}>
                        <View style={[styles.gradeCard, overallGrade.card]}>
                            <Text style={[styles.gradeLetter, overallGrade.letter]}>{overallLetter}</Text>
                            <Text style={styles.gradeLabel}>Overall</Text>
                        </View>
                        <View style={[styles.gradeCard, rlsGrade.card]}>
                            <Text style={[styles.gradeLetter, rlsGrade.letter]}>{getLetter(rlsScore)}</Text>
                            <Text style={styles.gradeLabel}>RLS</Text>
                        </View>
                        <View style={[styles.gradeCard, authGrade.card]}>
                            <Text style={[styles.gradeLetter, authGrade.letter]}>{getLetter(authScore)}</Text>
                            <Text style={styles.gradeLabel}>Auth / MFA</Text>
                        </View>
                        <View style={[styles.gradeCard, pitrGrade.card]}>
                            <Text style={[styles.gradeLetter, pitrGrade.letter]}>{getLetter(pitrScore)}</Text>
                            <Text style={styles.gradeLabel}>Backups</Text>
                        </View>
                    </View>
                </View>

                {/* Summary stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Scan Summary</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Security Score</Text>
                            <Text style={scoreStyle(report.score)}>{report.score}/100</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Critical Issues</Text>
                            <Text style={criticals.length > 0 ? styles.summaryValueRed : styles.summaryValueGreen}>
                                {criticals.length}
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Findings</Text>
                            <Text style={report.findings.length > 0 ? styles.summaryValueAmber : styles.summaryValueGreen}>
                                {report.findings.length}
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Tables Scanned</Text>
                            <Text style={styles.summaryValue}>{report.tables_scanned}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Scan Duration</Text>
                            <Text style={styles.summaryValue}>{report.scan_duration_ms}ms</Text>
                        </View>
                    </View>
                </View>

                {/* Critical issues list */}
                {criticals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Critical Issues Requiring Immediate Action</Text>
                        <View style={styles.criticalBox}>
                            <Text style={styles.criticalBoxTitle}>⚠ {criticals.length} Critical Issue{criticals.length > 1 ? 's' : ''} Found</Text>
                            {criticals.map((f, i) => (
                                <View key={i} style={styles.criticalItem}>
                                    <View style={styles.criticalDot} />
                                    <Text style={styles.criticalText}>[{f.category}] {f.table} — {f.message}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Enterprise Safeguards status */}
                {report.enterprise_safeguards && report.enterprise_safeguards.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Enterprise Safeguards</Text>
                        <View style={{ borderWidth: 1, borderColor: C.slate200, borderRadius: 6, overflow: 'hidden' }}>
                            <View style={[styles.safeguardRow, { backgroundColor: C.slate100 }]}>
                                <Text style={[styles.safeguardName, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Control</Text>
                                <Text style={[styles.safeguardDetail, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Detail</Text>
                                <Text style={[styles.statusPill, { color: C.slate500, backgroundColor: 'transparent' }]}>Status</Text>
                            </View>
                            {report.enterprise_safeguards.map((sg, i) => (
                                <View key={i} style={[styles.safeguardRow, { backgroundColor: i % 2 === 0 ? C.white : C.slate50 }]}>
                                    <Text style={styles.safeguardName}>{sg.name}</Text>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.safeguardDetail}>{sg.detail}</Text>
                                        {sg.status === 'UNKNOWN' && (
                                            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 2 }}>
                                                *(Requires direct Postgres connection)
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.statusPill, safeguardStatusStyle(sg.status)]}>{sg.status}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <PageFooter targetHost={targetHost} date={date} />
            </Page>

            {/* ── PAGE 2+: FINDINGS (Critical first, then grouped by category) ── */}
            {report.findings.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.header} fixed>
                        <Text style={styles.brandSub}>SUPASCAN — SECURITY FINDINGS</Text>
                        <Text style={styles.headerDate}>{targetHost}</Text>
                    </View>

                    {/* Critical findings */}
                    {criticals.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Critical Findings ({criticals.length})</Text>
                            {criticals.map((finding) => {
                                const s = findingCardStyle(finding.severity);
                                return (
                                    <View key={finding.id} style={[styles.findingCard, s.card]} wrap={false}>
                                        <View style={[styles.findingHeader, s.header]}>
                                            <Text style={[styles.severityBadge, s.badge]}>{finding.severity}</Text>
                                            <Text style={styles.categoryBadge}>{finding.category}</Text>
                                            <Text style={styles.findingTable}>{finding.table}</Text>
                                        </View>
                                        <View style={styles.findingBody}>
                                            <Text style={styles.findingMessage}>{finding.message}</Text>
                                            <View style={styles.riskBox}>
                                                <Text style={styles.riskLabel}>Why this matters</Text>
                                                <Text style={styles.riskText}>{finding.risk}</Text>
                                            </View>
                                            <View style={styles.codeBox}>
                                                <Text style={styles.codeLabel}>SQL Remediation</Text>
                                                <Text style={styles.codeText}>{finding.remediation}</Text>
                                            </View>
                                            {finding.remediation_cli && (
                                                <View style={[styles.codeBox, { marginTop: 4, backgroundColor: '#1e3a5f' }]}>
                                                    <Text style={styles.codeLabel}>Dashboard / CLI</Text>
                                                    <Text style={[styles.codeText, { color: '#93c5fd' }]}>{finding.remediation_cli}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Non-critical findings grouped by category */}
                    {categoryOrder.map(cat => {
                        const catFindings = grouped.get(cat);
                        if (!catFindings || catFindings.length === 0) return null;
                        return (
                            <View key={cat} style={styles.section}>
                                <Text style={styles.sectionTitle}>{cat} Findings ({catFindings.length})</Text>
                                {catFindings.map((finding) => {
                                    const s = findingCardStyle(finding.severity);
                                    return (
                                        <View key={finding.id} style={[styles.findingCard, s.card]} wrap={false}>
                                            <View style={[styles.findingHeader, s.header]}>
                                                <Text style={[styles.severityBadge, s.badge]}>{finding.severity}</Text>
                                                <Text style={styles.findingTable}>{finding.table}</Text>
                                            </View>
                                            <View style={styles.findingBody}>
                                                <Text style={styles.findingMessage}>{finding.message}</Text>
                                                <View style={styles.riskBox}>
                                                    <Text style={styles.riskLabel}>Why this matters</Text>
                                                    <Text style={styles.riskText}>{finding.risk}</Text>
                                                </View>
                                                <View style={styles.codeBox}>
                                                    <Text style={styles.codeLabel}>SQL Remediation</Text>
                                                    <Text style={styles.codeText}>{finding.remediation}</Text>
                                                </View>
                                                {finding.remediation_cli && (
                                                    <View style={[styles.codeBox, { marginTop: 4, backgroundColor: '#1e3a5f' }]}>
                                                        <Text style={styles.codeLabel}>Dashboard / CLI</Text>
                                                        <Text style={[styles.codeText, { color: '#93c5fd' }]}>{finding.remediation_cli}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}

                    {/* Verified Safeguards — exclude tables that have CRITICAL findings */}
                    {filteredPassedChecks.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Verified Safeguards ({filteredPassedChecks.length})</Text>
                            {filteredPassedChecks.map((check, i) => (
                                <View key={i} style={styles.passedItem}>
                                    <View style={styles.passedDot} />
                                    <Text style={styles.passedText}>{check}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <PageFooter targetHost={targetHost} date={date} />
                </Page>
            )}
        </Document>
    );
}

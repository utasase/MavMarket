import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, User, Package, ChevronDown, ChevronUp } from "lucide-react-native";
import {
  getOpenReports,
  getReportTargetName,
  takeModAction,
  type Report,
  type ModerationAction,
} from "../lib/moderation";

interface Props {
  onBack: () => void;
}

export function AdminModerationPanel({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setReports(await getOpenReports());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (reportId: string, action: ModerationAction) => {
    setActingId(reportId);
    try {
      await takeModAction({ reportId, action });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setExpandedId(null);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Moderation Queue</Text>
        {reports.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{reports.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#0064B1" />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptySubtext}>No open reports</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              expanded={expandedId === report.id}
              acting={actingId === report.id}
              onToggle={() =>
                setExpandedId(expandedId === report.id ? null : report.id)
              }
              onAction={(action) => handleAction(report.id, action)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ReportRow({
  report,
  expanded,
  acting,
  onToggle,
  onAction,
}: {
  report: Report;
  expanded: boolean;
  acting: boolean;
  onToggle: () => void;
  onAction: (action: ModerationAction) => void;
}) {
  const [targetName, setTargetName] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && targetName === null) {
      getReportTargetName(report.target_type, report.target_id)
        .then(setTargetName)
        .catch(() => setTargetName("Unknown"));
    }
  }, [expanded, targetName, report.target_type, report.target_id]);

  const isUnderReview = report.status === "under_review";

  return (
    <View style={styles.reportCard}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.reportRow}>
        <View style={styles.reportIcon}>
          {report.target_type === "user" ? (
            <User size={16} color="#6B7280" strokeWidth={1.5} />
          ) : (
            <Package size={16} color="#6B7280" strokeWidth={1.5} />
          )}
        </View>

        <View style={styles.reportInfo}>
          <Text style={styles.reportReason} numberOfLines={1}>
            {report.reason}
          </Text>
          <Text style={styles.reportMeta}>
            {report.target_type === "user" ? "User" : "Listing"} ·{" "}
            by {report.reporter_name} · {formatAge(report.created_at)}
          </Text>
        </View>

        <View style={styles.reportRight}>
          {isUnderReview && (
            <View style={styles.reviewingBadge}>
              <Text style={styles.reviewingText}>reviewing</Text>
            </View>
          )}
          {expanded ? (
            <ChevronUp size={16} color="#9CA3AF" strokeWidth={1.5} />
          ) : (
            <ChevronDown size={16} color="#9CA3AF" strokeWidth={1.5} />
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedBody}>
          {report.note ? (
            <Text style={styles.reportNote}>"{report.note}"</Text>
          ) : null}

          <Text style={styles.targetLabel}>
            {report.target_type === "user" ? "User: " : "Listing: "}
            <Text style={styles.targetName}>
              {targetName ?? "Loading…"}
            </Text>
          </Text>

          {acting ? (
            <ActivityIndicator color="#0064B1" style={styles.actingSpinner} />
          ) : (
            <View style={styles.actionRow}>
              <ActionButton
                label="Dismiss"
                color="#6B7280"
                onPress={() => onAction("dismiss")}
              />
              <ActionButton
                label="Escalate"
                color="#D97706"
                onPress={() => onAction("escalate")}
              />
              <ActionButton
                label="Resolve"
                color="#059669"
                onPress={() => onAction("resolve")}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ActionButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.actionBtn, { borderColor: color }]}
      activeOpacity={0.75}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatAge(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { flex: 1, fontSize: 18, color: "#111827" },
  countBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: { color: "#FFFFFF", fontSize: 11 },
  emptyTitle: { fontSize: 16, color: "#111827" },
  emptySubtext: { fontSize: 13, color: "#9CA3AF" },
  list: { paddingTop: 8, paddingBottom: 32 },
  reportCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  reportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  reportInfo: { flex: 1, gap: 2 },
  reportReason: { fontSize: 14, color: "#111827" },
  reportMeta: { fontSize: 11, color: "#9CA3AF" },
  reportRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewingText: { fontSize: 10, color: "#92400E" },
  expandedBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
  },
  reportNote: {
    fontSize: 13,
    color: "#4B5563",
    fontStyle: "italic",
    marginTop: 8,
  },
  targetLabel: { fontSize: 12, color: "#9CA3AF" },
  targetName: { color: "#111827" },
  actingSpinner: { marginVertical: 8 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 13 },
});

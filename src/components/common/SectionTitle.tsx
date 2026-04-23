type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        {subtitle ? (
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

import { InvoiceDetailModule } from "@/components/modules/invoice-detail-module";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceDetailModule invoiceId={id} />;
}

import { useSelector } from "react-redux";
import ServicesTable, { useServiceActions } from "@/components/Admin/Services";
import type { CategoryRecord, ServiceRecord } from "@/data/catalog";
import { useCatalog } from "@/hooks";
import { selectCatalogCategories, selectCatalogLoaded, selectCatalogServices } from "@/redux";

/** The Services tab: the booking menu, live from the database, editable in place. */
export default function AdminServicesPage() {
  useCatalog();
  const services: ServiceRecord[] = useSelector(selectCatalogServices);
  const categories: CategoryRecord[] = useSelector(selectCatalogCategories);
  const loaded: boolean = useSelector(selectCatalogLoaded);
  const { saveService, removeService } = useServiceActions();

  return (
    <ServicesTable
      services={services}
      categories={categories}
      loading={!loaded}
      onSaveService={saveService}
      onDeleteService={removeService}
    />
  );
}

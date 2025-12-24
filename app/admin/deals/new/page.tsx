import { CreateDealForm } from "@/components/admin/create-deal-form"

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Deal</h2>
        <p className="text-muted-foreground">Add a new commodity listing to the marketplace</p>
      </div>
      <CreateDealForm />
    </div>
  )
}


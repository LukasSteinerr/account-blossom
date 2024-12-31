import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ShoppingCart } from "lucide-react";
import { CodeListingForm } from "@/components/CodeListingForm";
import { CodeListings } from "@/components/CodeListings";
import { Navigation } from "@/components/Navigation";

const Dashboard = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto p-6">
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="buy">
              <ShoppingCart className="mr-2" />
              Buy Codes
            </TabsTrigger>
            <TabsTrigger value="sell">
              <Upload className="mr-2" />
              Sell Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            <CodeListings />
          </TabsContent>

          <TabsContent value="sell">
            <CodeListingForm />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default Dashboard;
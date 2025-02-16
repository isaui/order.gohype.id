import { Card, CardContent } from "@/components/ui/card"
import ContentSection from "./sections/ContentSection"
import HeaderSection from "./sections/HeaderSection"
import ScannerBottomNavbar from "@/components/shared/ScannerBottomNavbar"
import LoginSection from "./sections/LoginSection"
import Navbar from "@/components/shared/Navbar"
import { Lock } from "lucide-react"
import { createClient } from "@/utils/supabase/server"

type VisitorProps = {
    event: string
}

const VisitorModule: React.FC<VisitorProps> = async ({event}) => {
    let isAdminAndAuthenticated = false
    const supabase = createClient()
    const userResponse = await supabase.auth.getUser()
    if(userResponse.data.user){
       const queryUser = await supabase.from("user").select("*").eq("id", userResponse.data.user.id).single();
       if(queryUser.data && queryUser.data.role == 'ADMIN'){
        isAdminAndAuthenticated = true
       } 
    }


    if (!isAdminAndAuthenticated) {
        return (
            <div className="flex flex-col w-screen min-h-screen bg-background items-center justify-center">
                <Navbar isAuthRequired={true}/>
                <div className="max-w-md p-8 flex flex-col bg-white rounded-lg shadow-lg items-center text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        {`We're sorry, but you don't have permission to access this page. 
                        This area is restricted to administrators only.`}
                    </p>
                    <div className="flex w-full   mb-6 justify-center items-center">
                    <Lock className="w-12 h-auto "/>
                    </div>
                    <LoginSection/>
                </div>
            </div>
        )
    }

    return <div className="flex flex-col w-screen min-h-screen bg-background pr-4">
        <Card className="w-full bg-white mx-auto  rounded-none max-w-4xl border-0 md:border 
        shadow-none">
        <CardContent className="p-0 md:min-h-screen">
            <HeaderSection/>
            <div className="flex flex-col w-full md:py-4 md:px-4">
            <ContentSection/>
            </div>
        </CardContent>
        </Card>
        <ScannerBottomNavbar activeSection={"visitors"} eventPath={event}/>
    </div>
}

export default VisitorModule
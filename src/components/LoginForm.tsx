import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
import { FaGithub } from "react-icons/fa";

export default function LoginForm() {
  return (
    <form className="space-y-4 mt-4">
      <div className="space-y-2">
        {/* <Label htmlFor="email">Email</Label> */}
        <Input style={{marginBottom:"90px"}} id="email" type="email" placeholder="m@example.com" />
        <div style={{width:"23vw",marginTop: "40px", marginBottom: "30px" , height: "1px", backgroundColor:"grey"}}></div>
        <span style={{backgroundColor: "white", position: "absolute", left: "46vw", bottom: "18.3vw"}}>Or Continue With</span>
      </div>
      <div className="space-y-2">
        {/* <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" /> */}
        <Button style={{position: "absolute", width:"23vw", bottom:"42vh"}} className="w-full"> Sign In with Email </Button>
      </div>
      <Button className="w-full"> <FaGithub size={18} /> Github</Button>
    </form>
  )
}
"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CheckCircle, User, Wallet, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Header } from "@/components/shared/Header"
import { useGetProfile, useUpdateProfile } from "@/hooks/useProfile"
import { shortenAddress } from "@/utils/shortenAddress"
import { useAccountBalance, useWallet } from "@suiet/wallet-kit"
import { UserAvatar } from "@/components/shared/UserAvatar"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
})
const MIST_PER_SUI = 1_000_000_000;
export default function ProfilePage() {
    const [isUpdating, setIsUpdating] = useState(false)
    // Get Profile
    const { data: profile,isPending:profileLoading } = useGetProfile()

    // Update Profile 
    const { mutate: updateProfile, isPending, isSuccess, error, isError } = useUpdateProfile()

    // Wallet 
    const { connected, address ,chain} = useWallet()
    const { balance, loading: balanceLoading } = useAccountBalance()
    
    const readableSui = (rawBalance: bigint | number) => {
        return (Number(rawBalance) / MIST_PER_SUI).toFixed(2);
      };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: profile?.data?.name ?? "",
        },
    })

    // Update form values when profile data changes
    useEffect(() => {
        if (profile?.data?.name) {
            form.reset({
                name: profile.data.name
            })
        }
    }, [profile, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        updateProfile(values.name)
    }

    useEffect(() => {
        if (isSuccess) {
            toast.success("Profile Updated Successfully")
        }
        if (isError) {
            toast.error(error.message)
        }
    }, [isSuccess, isError, error])

    // Logs
    useEffect(() => {
        console.log(chain)
    },[chain])

    return (
        <>
            <Header />
            <div className="min-h-screen md:mt-16 bg-[#fff] flex flex-col items-center justify-center p-4">

                <div className="w-full max-w-md relative z-10">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Web3 Profile</h1>
                        <p className="text-gray-500 mt-2">Manage your blockchain identity</p>
                    </div>

                    {profileLoading ? (
                        <Card className="border-0 shadow-md bg-white">
                            <CardContent className="flex items-center justify-center h-64">
                                <div className="relative w-8 h-8  rounded-full">
                                    <div className="absolute inset-0 border-2 border-t-[#000] rounded-full animate-spin m-0.5"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : !connected ? (
                        <Card className="border-0 shadow-md bg-white">
                            <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User size={20} className="text-gray-700" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900">Wallet Not Connected</h3>
                                    <p className="text-sm text-gray-500 mt-1">Please connect your wallet to view your profile</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 shadow-md bg-white">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-medium text-gray-900">Profile Details</CardTitle>
                                        <CardDescription className="text-gray-500">Update your blockchain identity</CardDescription>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <UserAvatar
                                        walletAddress={profile?.data?.walletAddress}
                                        alt={profile?.data?.walletAddress || "Creator"}
                                    />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="mb-6 p-3 bg-gray-50 border-l-4 border-gray-200 flex items-center">
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium text-gray-700 block mb-0.5">Connected Address</span>
                                        {shortenAddress(profile?.data?.walletAddress)}
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs text-green-600">Active</span>
                                    </div>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">Display Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter your name"
                                                            className="bg-white border-gray-200 focus:border-black rounded-none h-12"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="w-full bg-black hover:bg-black/90 text-white font-medium py-6 rounded-none transition-all duration-200"
                                        >
                                            {isPending ?
                                                (
                                                    <div className="relative w-6 h-6 bg-[#000] rounded-full">
                                                        <div className="absolute inset-0 border-2 border-[#1b263b]  border-t-[#fff] rounded-full animate-spin m-0.5"></div>
                                                    </div>
                                                ) :
                                                "Update Profile"
                                            }
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-4 pb-6 border-t border-gray-100 mt-6">
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle size={10} className={connected ? 'text-green-500' : 'text-red-500'} /> 
                                        {connected ? 'Connected to Sui' : 'Disconnected'}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400">
                                    Last updated: {profile?.data?.updatedAt ? 
                                        (() => {
                                            const diff = new Date().getTime() - new Date(profile?.data?.updatedAt).getTime();
                                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            const hours = Math.floor(diff / (1000 * 60 * 60));
                                            const minutes = Math.floor(diff / (1000 * 60));
                                            const seconds = Math.floor(diff / 1000);

                                            if (days > 0) return `${days} days ago`;
                                            if (hours > 0) return `${hours} hours ago`;
                                            if (minutes > 0) return `${minutes} minutes ago`;
                                            return `${seconds} seconds ago`;
                                        })()
                                        : 'Never'}
                                </span>
                            </CardFooter>
                        </Card>
                    )}

                    <div className="mt-8 grid grid-cols-1 gap-4">
                        <div className="bg-white p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">SUI Balance</span>
                                <span className="text-xs text-gray-400">{chain?.name ?? "Sui Mainnet"}</span>
                            </div>
                            <div className="text-lg font-medium">{balance && readableSui(balance)} SUI</div>
                        </div>
                    </div>
                </div>

             </div>
        </>
    )
}

import { History, Shield, User } from 'lucide-react'
import { motion } from "framer-motion"
import React from 'react'

const Info = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm"
            >
                <div className="w-12 h-12 bg-[#e6f7ff] rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-[#0070f3]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verify Authenticity</h3>
                <p className="text-[#616161]">Confirm if an image is original or has been modified.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm"
            >
                <div className="w-12 h-12 bg-[#fff7e6] rounded-full flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-[#fa8c16]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Creator Information</h3>
                <p className="text-[#616161]">Discover who created the image and when it was made.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm"
            >
                <div className="w-12 h-12 bg-[#f6ffed] rounded-full flex items-center justify-center mb-4">
                    <History className="w-6 h-6 text-[#52c41a]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Provenance History</h3>
                <p className="text-[#616161]">Track the complete history and ownership of the image.</p>
            </motion.div>
        </div>

    )
}

export default Info
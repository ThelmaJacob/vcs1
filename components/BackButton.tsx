'use client' {/* for use in our client */}
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

{/* Make it reusable in all files */}
export default function BackButton() {

{/* Define constant from standard lib */}
const router = useRouter()

return (
<button
type="button"
onClick={() => router.back()}
{/* Visual type and formatting */}
className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
aria-label="Return to previous page"
>
<ArrowLeft className="w-4 h-4" aria-hidden="true" />
<span>Back</span>
</button>
)
}

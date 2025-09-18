"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, Share2, Sparkles } from "lucide-react"
import html2canvas from "html2canvas"

interface InspirationCardProps {
  problem: string
  keyword: string
  metaphor: string
  aiDescription?: string
}

export function InspirationCard({ problem, keyword, metaphor, aiDescription }: InspirationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const exportAsImage = async () => {
    if (!cardRef.current) return

    setIsExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      })

      const link = document.createElement("a")
      link.download = `inspiration-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error("Error exporting image:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const copyToClipboard = async () => {
    const text = `${problem} × ${keyword} × ${metaphor}${aiDescription ? `\n\n${aiDescription}` : ""}`
    await navigator.clipboard.writeText(text)
  }

  const shareCard = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "엉뚱한 영감 한 스푼",
        text: `${problem} × ${keyword} × ${metaphor}${aiDescription ? `\n\n${aiDescription}` : ""}`,
        url: window.location.href,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 p-8 backdrop-blur-md border border-white/20"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)
          `,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-600" />
        </div>

        <div className="relative z-10 text-center space-y-6">
          <h3 className="text-2xl font-bold text-white mb-6">엉뚱한 영감 한 스푼</h3>

          <div className="space-y-4">
            <Badge
              variant="secondary"
              className="px-6 py-3 text-lg rounded-full bg-white/20 text-white border-white/30 backdrop-blur-sm"
            >
              {problem}
            </Badge>

            <div className="text-3xl font-bold text-white/80">×</div>

            <Badge
              variant="outline"
              className="px-6 py-3 text-lg rounded-full border-white/40 text-white bg-white/10 backdrop-blur-sm"
            >
              {keyword}
            </Badge>

            <div className="text-3xl font-bold text-white/80">×</div>

            <Badge
              variant="default"
              className="px-6 py-3 text-lg rounded-full bg-white/20 text-white border-white/30 backdrop-blur-sm"
            >
              {metaphor}
            </Badge>
          </div>

          {aiDescription && (
            <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <p className="text-white/90 text-sm leading-relaxed">{aiDescription}</p>
            </div>
          )}

          <div className="text-xs text-white/60 mt-6">{new Date().toLocaleDateString("ko-KR")}</div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={copyToClipboard}
          variant="outline"
          size="sm"
          className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Copy className="w-4 h-4 mr-2" />
          복사
        </Button>

        <Button
          onClick={exportAsImage}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "저장 중..." : "저장"}
        </Button>

        <Button
          onClick={shareCard}
          variant="outline"
          size="sm"
          className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Share2 className="w-4 h-4 mr-2" />
          공유
        </Button>
      </div>
    </div>
  )
}

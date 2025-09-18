"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Sparkles, RefreshCw, Save, Plus, Calendar, Gift } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { InspirationCard } from "@/components/inspiration-card"

interface GeneratedIdea {
  problem: string
  keyword: string
  metaphor: string
  timestamp: number
  aiDescription?: string
}

interface DailyInspiration {
  problem: string
  keyword: string
  metaphor: string
  date: string
}

export default function Home() {
  const [currentIdea, setCurrentIdea] = useState<GeneratedIdea | null>(null)
  const [savedIdeas, setSavedIdeas] = useState<GeneratedIdea[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)
  const [dailyInspiration, setDailyInspiration] = useState<DailyInspiration | null>(null)
  const [showCard, setShowCard] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

  const [newProblem, setNewProblem] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [newMetaphor, setNewMetaphor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [problemError, setProblemError] = useState("")
  const [keywordError, setKeywordError] = useState("")
  const [metaphorError, setMetaphorError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    loadDailyInspiration()
  }, [])

  const loadDailyInspiration = async () => {
    const today = new Date().toISOString().split("T")[0]

    try {
      // Check if today's inspiration already exists
      const { data: existing } = await supabase
        .from("daily_inspirations")
        .select(`
          date,
          problems!inner(content),
          keywords!inner(content),
          metaphors!inner(content)
        `)
        .eq("date", today)
        .single()

      if (existing) {
        setDailyInspiration({
          problem: existing.problems.content,
          keyword: existing.keywords.content,
          metaphor: existing.metaphors.content,
          date: today,
        })
      } else {
        // Generate new daily inspiration
        await generateDailyInspiration(today)
      }
    } catch (error) {
      console.error("Error loading daily inspiration:", error)
    }
  }

  const generateDailyInspiration = async (date: string) => {
    try {
      // Get random items from each table
      const { data: problems } = await supabase.from("problems").select("*")
      const { data: keywords } = await supabase.from("keywords").select("*")
      const { data: metaphors } = await supabase.from("metaphors").select("*")

      if (problems && keywords && metaphors) {
        const randomProblem = problems[Math.floor(Math.random() * problems.length)]
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
        const randomMetaphor = metaphors[Math.floor(Math.random() * metaphors.length)]

        // Save to daily_inspirations table
        await supabase.from("daily_inspirations").insert({
          date,
          problem_id: randomProblem.id,
          keyword_id: randomKeyword.id,
          metaphor_id: randomMetaphor.id,
        })

        setDailyInspiration({
          problem: randomProblem.content,
          keyword: randomKeyword.content,
          metaphor: randomMetaphor.content,
          date,
        })
      }
    } catch (error) {
      console.error("Error generating daily inspiration:", error)
    }
  }

  const generateIdea = async () => {
    setIsGenerating(true)
    setShowCard(false)

    try {
      const { data: problems } = await supabase.from("problems").select("content")
      const { data: keywords } = await supabase.from("keywords").select("content")
      const { data: metaphors } = await supabase.from("metaphors").select("content")

      if (
        !problems ||
        !keywords ||
        !metaphors ||
        problems.length === 0 ||
        keywords.length === 0 ||
        metaphors.length === 0
      ) {
        console.log("[v0] Database is empty, showing fallback message")
        setIsGenerating(false)

        // Show a user-friendly message instead of throwing an error
        setCurrentIdea({
          problem: "데이터베이스가 비어있습니다",
          keyword: "관리자에게 문의하세요",
          metaphor: "초기 데이터를 추가해주세요",
          timestamp: Date.now(),
        })
        return
      }

      // Simulate liquid animation delay
      setTimeout(async () => {
        const problem = problems[Math.floor(Math.random() * problems.length)].content
        const keyword = keywords[Math.floor(Math.random() * keywords.length)].content
        const metaphor = metaphors[Math.floor(Math.random() * metaphors.length)].content

        const newIdea: GeneratedIdea = {
          problem,
          keyword,
          metaphor,
          timestamp: Date.now(),
        }

        setCurrentIdea(newIdea)
        setIsGenerating(false)

        // Generate AI description
        generateAIDescription(newIdea)
      }, 800)
    } catch (error) {
      console.error("Error generating idea:", error)
      setIsGenerating(false)

      setCurrentIdea({
        problem: "오류가 발생했습니다",
        keyword: "다시 시도해주세요",
        metaphor: "네트워크를 확인해주세요",
        timestamp: Date.now(),
      })
    }
  }

  const generateAIDescription = async (idea: GeneratedIdea) => {
    setIsGeneratingDescription(true)
    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: idea.problem,
          keyword: idea.keyword,
          metaphor: idea.metaphor,
        }),
      })

      if (response.ok) {
        const { description } = await response.json()
        setCurrentIdea((prev) => (prev ? { ...prev, aiDescription: description } : null))
      }
    } catch (error) {
      console.error("Error generating AI description:", error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const showInspirationCard = () => {
    setShowCard(true)
  }

  const checkDuplicate = async (table: string, content: string) => {
    if (!content.trim()) return false

    const { data, error } = await supabase.from(table).select("content").eq("content", content.trim()).single()

    return data !== null
  }

  const handleProblemChange = async (value: string) => {
    setNewProblem(value)
    setProblemError("")

    if (value.trim()) {
      const isDuplicate = await checkDuplicate("problems", value)
      if (isDuplicate) {
        setProblemError("입력하신 단어는 이미 존재합니다.")
      }
    }
  }

  const handleKeywordChange = async (value: string) => {
    setNewKeyword(value)
    setKeywordError("")

    if (value.trim()) {
      const isDuplicate = await checkDuplicate("keywords", value)
      if (isDuplicate) {
        setKeywordError("입력하신 단어는 이미 존재합니다.")
      }
    }
  }

  const handleMetaphorChange = async (value: string) => {
    setNewMetaphor(value)
    setMetaphorError("")

    if (value.trim()) {
      const isDuplicate = await checkDuplicate("metaphors", value)
      if (isDuplicate) {
        setMetaphorError("입력하신 단어는 이미 존재합니다.")
      }
    }
  }

  const submitContent = async () => {
    if (!newProblem.trim() && !newKeyword.trim() && !newMetaphor.trim()) {
      return
    }

    if (problemError || keywordError || metaphorError) {
      return
    }

    setIsSubmitting(true)

    try {
      const promises = []

      if (newProblem.trim()) {
        promises.push(supabase.from("problems").insert({ content: newProblem.trim() }))
      }

      if (newKeyword.trim()) {
        promises.push(supabase.from("keywords").insert({ content: newKeyword.trim() }))
      }

      if (newMetaphor.trim()) {
        promises.push(supabase.from("metaphors").insert({ content: newMetaphor.trim() }))
      }

      await Promise.all(promises)

      // Reset form
      setNewProblem("")
      setNewKeyword("")
      setNewMetaphor("")
      setProblemError("")
      setKeywordError("")
      setMetaphorError("")
      setShowAddContent(false)
    } catch (error) {
      console.error("Error submitting content:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveIdea = () => {
    if (
      currentIdea &&
      !savedIdeas.find(
        (idea) =>
          idea.problem === currentIdea.problem &&
          idea.keyword === currentIdea.keyword &&
          idea.metaphor === currentIdea.metaphor,
      )
    ) {
      setSavedIdeas([...savedIdeas, currentIdea])
    }
  }

  const removeSavedIdea = (timestamp: number) => {
    setSavedIdeas(savedIdeas.filter((idea) => idea.timestamp !== timestamp))
  }

  return (
    <div className="min-h-screen gradient-flow">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8 liquid-slide-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-balance gradient-text">엉뚱한 영감 한 스푼</h1>
          </div>
          <p className="text-lg text-foreground/90 mb-2">오늘의 문제 × 키워드 × 메타포</p>
          <p className="text-sm text-foreground/70">세상의 문제, 나만의 해답</p>
        </div>

        {/* Daily Inspiration */}
        {dailyInspiration && (
          <Card className="mb-6 border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5 text-accent" />
                오늘의 영감
                <Calendar className="w-4 h-4 text-foreground/60" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="text-xs rounded-full bg-secondary/80 text-secondary-foreground">
                  {dailyInspiration.problem}
                </Badge>
                <span className="text-primary font-bold">×</span>
                <Badge variant="outline" className="text-xs rounded-full border-accent/50 bg-accent/10 text-foreground">
                  {dailyInspiration.keyword}
                </Badge>
                <span className="text-primary font-bold">×</span>
                <Badge variant="default" className="text-xs rounded-full bg-primary/20 text-foreground">
                  {dailyInspiration.metaphor}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          <Button
            variant={!showSaved && !showAddContent ? "default" : "outline"}
            onClick={() => {
              setShowSaved(false)
              setShowAddContent(false)
              setShowCard(false)
            }}
            className="rounded-full px-4 bg-primary/90 hover:bg-primary border-primary/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            새로운 영감
          </Button>
          <Button
            variant={showSaved ? "default" : "outline"}
            onClick={() => {
              setShowSaved(true)
              setShowAddContent(false)
              setShowCard(false)
            }}
            className="rounded-full px-4 bg-secondary/90 hover:bg-secondary border-secondary/30"
          >
            <Heart className="w-4 h-4 mr-2" />
            저장된 아이디어 ({savedIdeas.length})
          </Button>
          <Button
            variant={showAddContent ? "default" : "outline"}
            onClick={() => {
              setShowAddContent(true)
              setShowSaved(false)
              setShowCard(false)
            }}
            className="rounded-full px-4 bg-accent/90 hover:bg-accent border-accent/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            내용 추가
          </Button>
        </div>

        {showAddContent ? (
          <Card className="mb-8 border-accent/20 bg-card/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl text-center">새로운 내용 추가하기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="problem">문제 (선택사항)</Label>
                <Textarea
                  id="problem"
                  placeholder="예: 플라스틱 오염, 소음 공해..."
                  value={newProblem}
                  onChange={(e) => handleProblemChange(e.target.value)}
                  className={`mt-1 ${problemError ? "border-red-500" : ""}`}
                />
                {problemError && <p className="text-red-500 text-sm mt-1">{problemError}</p>}
              </div>
              <div>
                <Label htmlFor="keyword">키워드 (선택사항)</Label>
                <Input
                  id="keyword"
                  placeholder="예: 나비, 음악, 여행..."
                  value={newKeyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  className={`mt-1 ${keywordError ? "border-red-500" : ""}`}
                />
                {keywordError && <p className="text-red-500 text-sm mt-1">{keywordError}</p>}
              </div>
              <div>
                <Label htmlFor="metaphor">메타포 (선택사항)</Label>
                <Input
                  id="metaphor"
                  placeholder="예: 시계, 거울, 책..."
                  value={newMetaphor}
                  onChange={(e) => handleMetaphorChange(e.target.value)}
                  className={`mt-1 ${metaphorError ? "border-red-500" : ""}`}
                />
                {metaphorError && <p className="text-red-500 text-sm mt-1">{metaphorError}</p>}
              </div>
              <Button
                onClick={submitContent}
                disabled={
                  isSubmitting ||
                  (!newProblem.trim() && !newKeyword.trim() && !newMetaphor.trim()) ||
                  problemError !== "" ||
                  keywordError !== "" ||
                  metaphorError !== ""
                }
                className="w-full rounded-full"
              >
                {isSubmitting ? "추가 중..." : "추가하기"}
              </Button>
            </CardContent>
          </Card>
        ) : !showSaved ? (
          <>
            {/* Show Card View or Regular View */}
            {showCard && currentIdea ? (
              <div className="mb-8">
                <InspirationCard
                  problem={currentIdea.problem}
                  keyword={currentIdea.keyword}
                  metaphor={currentIdea.metaphor}
                  aiDescription={currentIdea.aiDescription}
                />
                <div className="text-center mt-4">
                  <Button onClick={() => setShowCard(false)} variant="outline" className="rounded-full">
                    목록으로 돌아가기
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Main Idea Generation */}
                {!currentIdea ? (
                  <Card className="mb-8 border-2 border-dashed border-primary/30 bg-card/70 backdrop-blur-md">
                    <CardContent className="p-8 text-center">
                      <div className="mb-6">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center backdrop-blur-sm">
                          <Sparkles className="w-10 h-10 text-primary" />
                        </div>
                        <p className="text-foreground/80">버튼을 눌러 새로운 영감을 받아보세요!</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    className={`mb-8 border-primary/20 bg-card/70 backdrop-blur-md ${isGenerating ? "" : "liquid-slide-up"}`}
                  >
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">생성된 아이디어</h2>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-2">
                            <Badge
                              variant="secondary"
                              className="px-4 py-2 text-sm rounded-full bg-secondary/80 text-secondary-foreground"
                            >
                              문제: {currentIdea.problem}
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-primary">×</div>
                          <div className="flex items-center justify-center gap-2">
                            <Badge
                              variant="outline"
                              className="px-4 py-2 text-sm rounded-full border-accent/50 bg-accent/10 text-foreground"
                            >
                              키워드: {currentIdea.keyword}
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-primary">×</div>
                          <div className="flex items-center justify-center gap-2">
                            <Badge
                              variant="default"
                              className="px-4 py-2 text-sm rounded-full bg-primary/20 text-foreground border-primary/30"
                            >
                              메타포: {currentIdea.metaphor}
                            </Badge>
                          </div>
                        </div>

                        {/* AI description display */}
                        {isGeneratingDescription && (
                          <div className="mt-4 p-3 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">AI가 아이디어를 분석 중...</p>
                          </div>
                        )}

                        {currentIdea.aiDescription && (
                          <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
                            <p className="text-sm text-foreground/90 leading-relaxed">{currentIdea.aiDescription}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={saveIdea}
                          variant="outline"
                          className="flex-1 rounded-full border-primary/30 hover:bg-primary/20 bg-primary/10 text-primary"
                          disabled={savedIdeas.some(
                            (idea) =>
                              idea.problem === currentIdea.problem &&
                              idea.keyword === currentIdea.keyword &&
                              idea.metaphor === currentIdea.metaphor,
                          )}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          저장하기
                        </Button>

                        {/* Card view button */}
                        <Button
                          onClick={showInspirationCard}
                          variant="default"
                          className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          카드로 보기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generate Button */}
                <div className="text-center">
                  <Button
                    onClick={generateIdea}
                    disabled={isGenerating}
                    size="lg"
                    className={`rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 ${
                      isGenerating ? "liquid-pulse" : "hover:liquid-bounce"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        영감 생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {currentIdea ? "다시 뽑기" : "영감 받기"}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Saved Ideas */
          <div className="space-y-4">
            {savedIdeas.length === 0 ? (
              <Card className="border-2 border-dashed border-muted-foreground/30 bg-card/70 backdrop-blur-md">
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-foreground/80">아직 저장된 아이디어가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              savedIdeas.map((idea) => (
                <Card key={idea.timestamp} className="liquid-slide-up bg-card/70 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs rounded-full bg-secondary/80 text-secondary-foreground"
                        >
                          {idea.problem}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs rounded-full border-accent/50 bg-accent/10 text-foreground"
                        >
                          {idea.keyword}
                        </Badge>
                        <Badge variant="default" className="text-xs rounded-full bg-primary/20 text-foreground">
                          {idea.metaphor}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => removeSavedIdea(idea.timestamp)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive rounded-full"
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-xs text-foreground/60">{new Date(idea.timestamp).toLocaleDateString("ko-KR")}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

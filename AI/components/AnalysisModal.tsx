'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Brain, TrendingUp } from 'lucide-react'
import { NodeData } from './NodeTree'

interface AnalysisModalProps {
  node: NodeData
  isOpen: boolean
  onClose: () => void
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  node, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !node.analysisResult) return null

  const { description, bonus } = node.analysisResult

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Kết quả phân tích: {node.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mô tả chính */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tổng quan phân tích
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </CardContent>
          </Card>

          {/* Bonus analysis */}
          {bonus && Object.keys(bonus).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Phân tích chi tiết</h3>
              <div className="grid gap-4">
                {Object.entries(bonus).map(([key, value]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Phân tích {key}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

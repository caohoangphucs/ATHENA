'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown, Eye } from 'lucide-react'
import { AnalysisModal } from './AnalysisModal'
import { AnalysisResult } from '@/lib/gemini'

export interface NodeData {
  id: string
  title: string
  description?: string
  children?: NodeData[]
  analysisResult?: AnalysisResult
  isExpanded?: boolean
}

interface NodeTreeProps {
  node: NodeData
  onNodeClick: (nodeId: string) => void
  onAnalyze: (nodeId: string, analysisType: string) => Promise<void>
  level?: number
}

export const NodeTree: React.FC<NodeTreeProps> = ({ 
  node, 
  onNodeClick, 
  onAnalyze, 
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded || false)
  const [showModal, setShowModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
    onNodeClick(node.id)
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      await onAnalyze(node.id, node.title)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleViewDetails = () => {
    setShowModal(true)
  }

  const marginLeft = level * 20

  return (
    <div className="w-full">
      <div 
        className="flex items-center gap-2 mb-2"
        style={{ marginLeft: `${marginLeft}px` }}
      >
        {node.children && node.children.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExpand}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <Card className="flex-1 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{node.title}</CardTitle>
            {node.description && (
              <p className="text-sm text-muted-foreground">{node.description}</p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                size="sm"
                className="flex items-center gap-1"
              >
                {isAnalyzing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
              </Button>
              
              {node.analysisResult && (
                <Button 
                  onClick={handleViewDetails}
                  variant="outline"
                  size="sm"
                >
                  Xem chi tiết
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isExpanded && node.children && (
        <div className="ml-4">
          {node.children.map((child) => (
            <NodeTree
              key={child.id}
              node={child}
              onNodeClick={onNodeClick}
              onAnalyze={onAnalyze}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {showModal && node.analysisResult && (
        <AnalysisModal
          node={node}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

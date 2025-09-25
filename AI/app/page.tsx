'use client'

import React, { useState, useCallback } from 'react'
import { NodeTree, NodeData } from '@/components/NodeTree'
import { analyzeUserBehavior } from '@/lib/gemini'
import { Brain, Users, UserCheck } from 'lucide-react'

// Dữ liệu mẫu hành vi người dùng
const sampleUserData = {
  totalUsers: 1250,
  activeUsers: 890,
  newUsers: 156,
  userSegments: {
    premium: 234,
    standard: 567,
    basic: 449
  },
  userActivities: {
    dailyActive: 456,
    weeklyActive: 789,
    monthlyActive: 890
  },
  userBehavior: {
    avgSessionTime: "12.5 minutes",
    mostUsedFeatures: ["Dashboard", "Analytics", "Reports"],
    conversionRate: "23.4%"
  },
  detailedAnalytics: {
    engagementMetrics: {
      pageViews: 15420,
      bounceRate: "34.2%",
      timeOnSite: "8.7 minutes"
    },
    userJourney: {
      signupToFirstAction: "2.3 days",
      firstActionToPurchase: "5.7 days",
      retentionRate: "67.8%"
    },
    featureUsage: {
      dashboard: 89.2,
      analytics: 67.4,
      reports: 45.8,
      settings: 23.1
    }
  }
}

export default function HomePage() {
  const [rootNode, setRootNode] = useState<NodeData>({
    id: 'root',
    title: 'Phân tích thành phần người dùng',
    description: 'Phân tích toàn diện hành vi người dùng trong hệ sinh thái ATHENA Sovico',
    children: [
      {
        id: 'all-users',
        title: 'Phân tích tất cả người dùng',
        description: 'Phân tích hành vi của toàn bộ người dùng trong hệ thống'
      },
      {
        id: 'specific-users',
        title: 'Phân tích người dùng cụ thể',
        description: 'Phân tích hành vi của nhóm người dùng đặc biệt'
      }
    ]
  })

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('Node clicked:', nodeId)
  }, [])

  const handleAnalyze = useCallback(async (nodeId: string, analysisType: string) => {
    try {
      console.log('Analyzing node:', nodeId, 'Type:', analysisType)
      
      // Gọi API Gemini để phân tích
      const result = await analyzeUserBehavior(sampleUserData, analysisType)
      
      // Cập nhật node với kết quả phân tích
      setRootNode(prevNode => {
        const updateNode = (node: NodeData): NodeData => {
          if (node.id === nodeId) {
            return {
              ...node,
              analysisResult: result,
              children: result.bonus ? Object.entries(result.bonus).map(([key, value], index) => ({
                id: `${nodeId}-bonus-${key}`,
                title: `Phân tích ${key}`,
                description: value,
                analysisResult: undefined
              })) : node.children
            }
          }
          
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateNode)
            }
          }
          
          return node
        }
        
        return updateNode(prevNode)
      })
    } catch (error) {
      console.error('Error analyzing node:', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">
              ATHENA AI Analysis
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Phân tích hành vi người dùng trong hệ sinh thái Sovico với trí tuệ nhân tạo
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">1,250</h3>
                <p className="text-gray-600">Tổng người dùng</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">890</h3>
                <p className="text-gray-600">Người dùng hoạt động</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">23.4%</h3>
                <p className="text-gray-600">Tỷ lệ chuyển đổi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Node Tree */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Cây phân tích hành vi người dùng
          </h2>
          
          <NodeTree
            node={rootNode}
            onNodeClick={handleNodeClick}
            onAnalyze={handleAnalyze}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Hướng dẫn sử dụng:
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Click vào mũi tên để mở rộng/thu gọn các node con</li>
            <li>• Click "Phân tích" để AI phân tích dữ liệu và tạo node con mới</li>
            <li>• Click "Xem chi tiết" để xem kết quả phân tích chi tiết</li>
            <li>• Mỗi node con sẽ được tạo dựa trên kết quả phân tích từ AI</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

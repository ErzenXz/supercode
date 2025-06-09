import { NextRequest, NextResponse } from 'next/server'
import { getConfiguredProviders } from '@/lib/ai-providers'

export async function GET() {
  try {
    const providers = getConfiguredProviders()
    
    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKeys } = body

    // In a real application, you would save these to a secure database
    // For this demo, we'll just return success
    // The API keys should be stored encrypted and associated with the user

    console.log('API keys would be saved:', Object.keys(apiKeys))

    return NextResponse.json({ 
      success: true,
      message: 'Settings saved successfully'
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

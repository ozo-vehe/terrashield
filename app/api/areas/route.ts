import { NextResponse } from 'next/server'
import { demoProvider } from '@/lib/climate/types'
export async function GET(){ return NextResponse.json({ data: await demoProvider.getAreas(), sourceType:'synthetic' }) }

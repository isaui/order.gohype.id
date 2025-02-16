'use client'

import React, { useRef, useState } from 'react';
import Scanner from './module-elements/Scanner';
import Stack from '@/components/shared/Stack';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ResultSection from './sections/ResultSection';
import { TicketHolderWithTicketOrderData } from './interface';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export const ScannerModule: React.FC = () => {

  const [displayState, setDisplayState] = useState<'QR' |'USER'>('QR')
  const [currentTicketHolder, setCurrentTicketHolder] = useState<null | TicketHolderWithTicketOrderData > (null)
  const isInTransitionQRRef = useRef<boolean>(false)
  const {toast} = useToast()

  const router = useRouter()

  const getTicketHolderDataById = async (id: string)=> {
    const supabase = createClient()
     const queryTicketHolder = supabase
     .from("ticket_holder")
     .select("*, order_data: order(*, ticket_data: ticket(*))")
     .eq("id", id).maybeSingle()
     const {data: ticketHolder, error: ticketHolderError} = await queryTicketHolder;
     if(ticketHolderError){
      console.log(ticketHolderError)
     }
     return ticketHolder && ticketHolder.order_data && ticketHolder.order_data.ticket_data? ticketHolder : null
  }

  const refreshTicketHolder = async () => {
     if(currentTicketHolder){
       const ticketHolder = await getTicketHolderDataById(currentTicketHolder.id);
       if(ticketHolder){
        setCurrentTicketHolder(ticketHolder as any)
       }
     }
  }

  const handleNewQrString = async (qrString: string)=> {
     isInTransitionQRRef.current = true
     const ticketHolder = await getTicketHolderDataById(qrString)
     if(ticketHolder){
       setDisplayState('USER')
       setCurrentTicketHolder(ticketHolder as any)
     }
     else{
      toast({description:"Ticket tidak ditemukan", variant:"destructive"})
     }
     isInTransitionQRRef.current = false
  }

  const handleBackToScan = () => {
    setDisplayState('QR')
  }


  const generateScannerDisplay = () => {
    return <Stack className='max-w-4xl border border-gray-200'> 
    <div className="w-full  h-full flex items-center justify-center ">
      <Scanner
      isInTransition={isInTransitionQRRef.current}
      onSend={handleNewQrString}
      />
    </div>
    <div className='w-full h-32 bg-black opacity-40 mb-auto mt-12'></div>
    <div className='w-full h-32 bg-black opacity-40 mt-auto'></div>
    <div className='px-2 py-4 flex items-center bg-white gap-x-2 w-full border-b-2 border-gray-200 mb-auto'>
    <ArrowLeft onClick={()=> router.back()}/>
    <h1>Back</h1>
    </div>
    </Stack>
  }

  return (
    <div className="flex flex-col gap-10 items-center h-screen md:px-4">
      {displayState == 'QR' && generateScannerDisplay()}
      {displayState == 'USER' && currentTicketHolder && 
      <ResultSection 
      onBack={handleBackToScan} 
      ticketHolder={currentTicketHolder}
      onRefresh={refreshTicketHolder}
      />}
    </div>
  );
};

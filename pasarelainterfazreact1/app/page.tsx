"use client"

import dynamic from "next/dynamic"
import "../interfaz-react/src/pages/styles.css"

const PaymentGateway = dynamic(() => import("../interfaz-react/src/pages/PaymentGateway"), { ssr: false })

export default function Page() {
  return (
    <div className="container">
      <PaymentGateway />
    </div>
  )
}

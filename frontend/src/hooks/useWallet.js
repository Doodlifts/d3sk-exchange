import { useState, useEffect } from 'react'
import { fcl } from '../config/fcl'

export function useWallet() {
  const [user, setUser] = useState({ loggedIn: false, addr: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = fcl.currentUser.subscribe((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const connect = async () => {
    try {
      await fcl.authenticate()
    } catch (err) {
      console.error('Wallet connection failed:', err)
    }
  }

  const disconnect = async () => {
    await fcl.unauthenticate()
  }

  return { user, loading, connect, disconnect }
}

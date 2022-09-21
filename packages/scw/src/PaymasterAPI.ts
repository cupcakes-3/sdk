import { UserOperationStruct } from '@account-abstraction/contracts'
import { resolveProperties } from '@ethersproject/properties'
import axios from 'axios'

export class PaymasterAPI {
  constructor(readonly apiUrl: string, readonly apiKey: string) {
    axios.defaults.baseURL = apiUrl
  }

  async getPaymasterAndData(userOp: Partial<UserOperationStruct>): Promise<string> {
    userOp = await resolveProperties(userOp)
    const result = await axios.post('/signPaymaster', {
      apiKey: this.apiKey,
      userOp,
    })

    return result.data.paymasterAndData
  }
}

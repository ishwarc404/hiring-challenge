import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

// Note: Bug 7 is resolved as well due to state changes! wohoo!

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false)
  // This fixed both pt1 and pt2
  // Don't really need the other loading flag I guess
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setAllTransactions] = useState<Transaction[] | null>(null)

  useEffect(() => {
    if (paginatedTransactions) {
      setAllTransactions((prevTransactions) => {
        return prevTransactions ? [...prevTransactions,...paginatedTransactions.data] : paginatedTransactions.data
      })}
  }, [paginatedTransactions])

  useEffect(() => {
    if (transactionsByEmployee) {
      setAllTransactions(transactionsByEmployee)
    }}, [transactionsByEmployee])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    setIsLoadingDropdown(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoadingDropdown(false)
    await paginatedTransactionsUtils.fetchAll()
    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsLoading(true)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
      setIsLoading(false)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoadingDropdown}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && !isLoading && (
            <button
              className="RampButton"
              disabled={isLoading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}

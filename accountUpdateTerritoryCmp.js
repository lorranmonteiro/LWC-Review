import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import getTerritoryList from '@salesforce/apex/AccountTerritoryButtonController.getTerritoryList';
import checkAccountInApprovalProcess from '@salesforce/apex/AccountTerritoryButtonController.checkInApprovalProcess';
import updateAccountTerritory from '@salesforce/apex/AccountTerritoryButtonController.updateAccountTerritory';

export default class AccountUpdateTerritoryCmp extends LightningElement {

    @api recordId;
    @wire(getTerritoryList) territoryList;

    selectedTerritoryId;
    selectedTerritoryName;
    justification;
    showSpinner = false;

    get isDataLoaded() {
        return this.territoryList && this.territoryList.data && !this.showSpinner;
    }

    get territoryOptions() {
        return this.territoryList.data.map(territory => {
            return {
                label: territory.Description ? territory.Name + ' - ' + territory.Description : territory.Name,
                value: territory.Id
            };
        });
    }

    handleTerritoryChange(event) {
        let territoryId = event.detail.value,
            selectedTerritory = this.territoryList.data.find(value => value.Id === territoryId);

        if (selectedTerritory) {
            this.selectedTerritoryId = selectedTerritory.Id;
            this.selectedTerritoryName = selectedTerritory.Name;
        } else {
            this.selectedTerritoryId = null;
            this.selectedTerritoryName = null;
        }

        console.log(`TerritoryId: ${this.selectedTerritoryId}`);
        console.log(`TerritoryName: ${this.selectedTerritoryName}`);
    }

    handleJustificationChange(event) {
        this.justification = event.detail.value;
    }

    toggleSpinner() {
        this.showSpinner = !this.showSpinner;
    }

    handleCancel() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    async handleSubmit() {
        this.toggleSpinner();

        // Verifica se os campos de território e justificativa estão preenchidos
        if (!this.areFieldsSet()) return;

        try {
            const isInApproval = await checkAccountInApprovalProcess({ accId: this.recordId });

            if (isInApproval) {
                this.dispatchEvent(new CloseActionScreenEvent());
                this.notify('Conta já está em fluxo de aprovação. Caso precise alterar o território, solicite um recall do fluxo.');
                return;
            }

            await this.callUpdateAccountTerritory();
        } catch(error) {
            this.notify(error.body.message, 'error');
        };
    }

    areFieldsSet() {
        if (!this.selectedTerritoryId|| !this.selectedTerritoryName) {
            this.notify('Necessário informar algum território.');
            return false;  
        }

        if (!this.justification) {
            this.notify('A justificativa não pode ser vazia.');
            return false;
        }

        return true;
    }

    async callUpdateAccountTerritory() {
        try {
            const updateAccountTerritoryResult = await updateAccountTerritory({
                accountId: this.recordId,
                TerritoryId: this.selectedTerritoryId,
                TerritoryName: this.selectedTerritoryName,
                justificativa: this.justification
            });

            if (updateAccountTerritoryResult) {
                const { msg } = JSON.parse(updateAccountTerritoryResult)
                console.log(`accountUpdateResponse Message: ${msg}`);

                this.dispatchEvent(new CloseActionScreenEvent());
                this.notify(msg, 'success', 'Conta atualizada!');
                return;
            }

            this.notify('Erro ao atualizar a conta. Por favor, tente novamente.', 'error');
        } catch(error) {
            this.notify(error.body.message);
        };
    }

    notify(message, variant = 'warning', title = 'Ocorreu um erro') {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );

        this.toggleSpinner();
    }
}
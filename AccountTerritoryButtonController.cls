/**
 * @description       : Account Territory Button Controller
 * @author            : SFIEC
 * @group             : SFIEC
 * @last modified on  : 04/03/2024
 * @last modified by  : Lorran Monteiro
**/
public class AccountTerritoryButtonController {
    @AuraEnabled(cacheable=true)
    public static List<Territory2> getTerritoryList(){
        return [Select Id, Name, Description From Territory2 Where Territory2Model.State = 'Active'];
    }
    
    @AuraEnabled
    public static Boolean checkInApprovalProcess(String accId){
        return Approval.isLocked(accId);
    }
    
    @AuraEnabled(cacheable=true)
    public static String getTerritorioInfo(String accId){
        List<Account> acc = [Select Id, TerritoryName__c, CNPJ__c From Account Where Id =: accId];
        
        
        if(!acc.isEmpty()){
            return '{ "showInfo": true, "territory": "' + acc[0].TerritoryName__c + '", "cnpj": "' + acc[0].CNPJ__c + '" }';
        } else {
            return '{ "showInfo": false }';
        }
    }
    
    @AuraEnabled
    public static String updateAccountTerritory(String accountId, String TerritoryId, String TerritoryName, String justificativa){
        String response = '{"msg": ""}';
        Account acc = [Select Id, TerritoryId__c, TerritoryName__c, JustificativaTerritorio__c From Account Where Id =: accountId];
        Profile pf = [Select Id, Name From PROFILE Where Id =: UserInfo.getProfileId()];
        if(justificativa == acc.JustificativaTerritorio__c){
            throw new AuraHandledException(Label.UI_Error_Message_Justificativa_Territorio);
        }
        if(TerritoryId == acc.TerritoryId__c){
            throw new AuraHandledException(Label.UI_Error_Message_Equals_Territorio);
        }
        try {
            if(pf.Name == 'GEVEN Backoffice' || pf.Name == 'GEVEN Gestão') {
                acc.TerritoryId__c = TerritoryId;
                acc.TerritoryName__c = TerritoryName;
                acc.JustificativaTerritorio__c = justificativa;
                update acc;
                response =  '{"msg": "' + Label.UI_Success_Message_Alterar_Territorio + '"}';
            }else{
                acc.JustificativaTerritorioEmAprovacao__c = justificativa;
                acc.IdTerritorioEmAprovacao__c = TerritoryId;
                acc.NameTerritorioEmAprovacao__c = TerritoryName;
                acc.AprovacaoTerritorio__c = 'Aguardando Aprovação';
            
                update acc;
                response = '{"msg": "' + Label.UI_Success_Message_Submit_Territorio + '"}';
            }
        } catch (Exception e) {
            throw new AuraHandledException(Label.UI_Error_Message_Alterar_Territorio + '\n Detalhes: ' + e.getMessage());
        }
        
        return response;
    }
}
const { expect } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

function encodeLeaf(address, spots) {
    // Same as abi.encodePacked in Solidity.
    return ethers.utils.defaultAbiCoder.encode(
        ["address","uint64"], //The datatypes of arguments to encode.
        [address, spots] //The actual values
    )
}
describe("Merkle Trees", function(){
    it("Should be able to verify if address is in whitelist or not", async function(){

        //Get a bunch of test addresses.
        // Hardhat returns 10 signers when running in a test enviroment.
        const testAddresses = await ethers.getSigners();
        // Create an array of ABI-encoded elements to put in the Merkle Tree.
        const list = [
            encodeLeaf(testAddresses[0]. address, 2),
            encodeLeaf(testAddresses[1]. address, 2),
            encodeLeaf(testAddresses[2]. address, 2),
            encodeLeaf(testAddresses[3]. address, 2),
            encodeLeaf(testAddresses[4]. address, 2),
            encodeLeaf(testAddresses[5]. address, 2),
        ];

        const merkleTree = new MerkleTree(list, keccak256,{
           hashLeaves : true,
           sortPairs : true,
           sortLeaves: true, 
        });
        const root = merkleTree.getHexRoot();
        const whitelist = await ethers.getContractFactory("Whitelist");
        const WhitelistContratct = await whitelist.deploy(root);
        await WhitelistContratct.deployed();

        //Check for valid addresses.
        for(let i = 0; i < 6; i++){
            const leaf = keccak256(list[i]);
            const proof = merkleTree.getHexProof(leaf);
            const connectedWhitelist = await WhitelistContratct.connect(testAddresses[i]);
            const verified = await connectedWhitelist.checkInWhiteList(proof, 2);
            expect(verified).to.equal(true);
        }
        // Check for Invalid addresses.
        const verifiedInvalid = await WhitelistContratct.checkInWhiteList([], 2);
        expect(verifiedInvalid).to.equal(false);
    })
})